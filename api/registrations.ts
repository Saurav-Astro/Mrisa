import type { IncomingMessage, ServerResponse } from "http";
import { getMongoDb } from "./_lib/mongo.js";
import { getBearerToken, verifyAdminToken } from "./_lib/auth.js";
import { ObjectId } from "mongodb";
import {
  applySecurityHeaders,
  checkRateLimit,
  readBodySecure,
  sanitizeString,
  isValidObjectId,
  sendInternalError,
} from "./_lib/security.js";

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

const requireAdmin = (req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }) => {
  const token = getBearerToken(req.headers.authorization as string | undefined);
  return Boolean(verifyAdminToken(token));
};

export default async function handler(
  req: IncomingMessage & {
    body?: unknown;
    query?: Record<string, string | string[]>;
    headers: Record<string, string | string[] | undefined>;
  },
  res: ServerResponse
) {
  applySecurityHeaders(res);

  try {
    const db = await getMongoDb();
    const collection = db.collection("registrations");

    // ── Public count endpoint ────────────────────────────────────────────────
    if (req.method === "GET" && req.query?.count) {
      // Light rate limit for public count (60/min per IP)
      if (!checkRateLimit(req, res, "GET:/api/registrations/count", { limit: 60, windowMs: 60 * 1000 })) return;

      const eventId = req.query?.event_id ? sanitizeString(req.query.event_id, 64) : null;
      const query = eventId ? { event_id: eventId } : {};
      const count = await collection.countDocuments(query);
      return sendJson(res, 200, { count });
    }

    // ── Admin-only: GET full list ─────────────────────────────────────────────
    if (req.method === "GET") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
      if (!checkRateLimit(req, res, "GET:/api/registrations", { limit: 120, windowMs: 60 * 1000 })) return;

      const eventId = req.query?.event_id ? sanitizeString(req.query.event_id, 64) : null;
      const query = eventId ? { event_id: eventId } : {};
      const regs = await collection.find(query).sort({ created_at: -1 }).toArray();
      return sendJson(res, 200, regs.map(r => ({ ...r, id: String(r._id) })));
    }

    // ── Admin-only: PUT edit a registration ──────────────────────────────────
    if (req.method === "PUT") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });

      const body = await readBodySecure(req, res);
      if (!body) return;

      const id = sanitizeString(body.id, 64);
      if (!id || !isValidObjectId(id)) return sendJson(res, 400, { error: "Invalid registration ID" });

      const { id: _id, _id: __id, created_at, event_id, transaction_id_normalised, ...rest } = body as any;

      // Sanitize every string field in rest
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        cleaned[k] = typeof v === "string" ? sanitizeString(v, 2000) : v;
      }

      const update = { ...cleaned, updated_at: new Date().toISOString() };
      const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
      if (!result.matchedCount) return sendJson(res, 404, { error: "Registration not found" });
      return sendJson(res, 200, { ok: true });
    }

    // ── Admin-only: DELETE ────────────────────────────────────────────────────
    if (req.method === "DELETE") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });

      const id = sanitizeString(req.query?.id, 64);
      if (!id || !isValidObjectId(id)) return sendJson(res, 400, { error: "Invalid registration ID" });

      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) return sendJson(res, 404, { error: "Registration not found" });
      return sendJson(res, 200, { ok: true });
    }

    // ── Public: POST submit a registration ───────────────────────────────────
    if (req.method !== "POST") {
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    // Rate limit: 5 submissions per IP per 10 minutes (prevents spam registrations)
    if (!checkRateLimit(req, res, "POST:/api/registrations", { limit: 5, windowMs: 10 * 60 * 1000 })) return;

    // Max 4 MB (covers base64 QR + team data)
    const body = await readBodySecure(req, res, 4 * 1024 * 1024);
    if (!body) return;

    const eventId = sanitizeString(body.event_id, 64);
    if (!eventId) return sendJson(res, 400, { error: "Missing event_id" });

    // Sanitize all top-level string fields
    const name = sanitizeString(body.name, 200);
    const email = sanitizeString(body.email, 320).toLowerCase();
    const teamName = sanitizeString(body.team_name, 200);
    const transactionId = body.transaction_id ? sanitizeString(body.transaction_id, 200) : null;
    const paymentProofUrl = body.payment_proof_url ? sanitizeString(body.payment_proof_url, 2048) : null;
    const registrationType = sanitizeString(body.registration_type, 20);
    const registrationCategory = sanitizeString(body.registration_category, 50);

    // Validate team_members array (each member's fields sanitized)
    const rawMembers = Array.isArray(body.team_members) ? body.team_members : null;
    const teamMembers = rawMembers
      ? rawMembers.slice(0, 20).map((m: any) => {
          if (typeof m !== "object" || m === null) return {};
          const cleaned: Record<string, string> = {};
          for (const [k, v] of Object.entries(m)) {
            const safeKey = sanitizeString(k, 100);
            const safeVal = sanitizeString(v, 500);
            if (safeKey) cleaned[safeKey] = safeVal;
          }
          return cleaned;
        })
      : null;

    // ── Unique Transaction ID check ──────────────────────────────────────────
    if (transactionId) {
      const normalised = transactionId.toLowerCase().replace(/\s+/g, "");
      const existing = await collection.findOne(
        { transaction_id_normalised: normalised },
        { projection: { _id: 1 } }
      );
      if (existing) {
        return sendJson(res, 409, {
          error: "DUPLICATE_TRANSACTION_ID",
          message: "This Reference / Transaction ID has already been used. Each payment must have a unique transaction ID.",
        });
      }
    }

    await collection.insertOne({
      event_id: eventId,
      name,
      email,
      team_name: teamName || null,
      registration_type: registrationType || null,
      registration_category: registrationCategory || null,
      payment_proof_url: paymentProofUrl,
      transaction_id: transactionId,
      transaction_id_normalised: transactionId
        ? transactionId.toLowerCase().replace(/\s+/g, "")
        : null,
      team_members: teamMembers,
      dynamic_fields: teamMembers?.[0] || {},
      created_at: new Date().toISOString(),
    });

    return sendJson(res, 201, { ok: true });
  } catch (error) {
    sendInternalError(res, error, "registrations");
  }
}
