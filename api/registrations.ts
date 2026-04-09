import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./_lib/mongo.js";
import { getBearerToken, verifyAdminToken } from "./_lib/auth.js";

const sendJson = (res: ServerResponse, code: number, data: unknown) => {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.end(JSON.stringify(data));
};

const sanitize = (v: unknown, max = 1000): string =>
  String(v ?? "").trim().replace(/<[^>]*>/g, "").replace(/\0/g, "").slice(0, max);

const isValidId = (v: unknown) => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);

const readBody = async (req: IncomingMessage & { body?: unknown }, maxLimit = 10 * 1024 * 1024): Promise<Record<string, unknown>> => {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  if (typeof req.body === "string") { try { return JSON.parse(req.body || "{}"); } catch { return {}; } }
  let raw = ""; let bytes = 0;
  for await (const chunk of req) {
    bytes += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk as string);
    if (bytes > maxLimit) return {};
    raw += chunk;
  }
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};

const requireAdmin = (req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }) =>
  Boolean(verifyAdminToken(getBearerToken(req.headers.authorization as string | undefined)));

export default async function handler(
  req: IncomingMessage & { body?: unknown; query?: Record<string, string | string[]>; headers: Record<string, string | string[] | undefined> },
  res: ServerResponse
) {
  try {
    const db = await getMongoDb();
    if (req.method === "GET" && req.query?.count) {
      if (!db) return sendJson(res, 200, { count: 0 });
      const eventId = req.query?.event_id ? sanitize(req.query.event_id, 64) : null;
      const query = eventId ? { event_id: eventId } : {};
      const count = await db.collection("registrations").countDocuments(query);
      return sendJson(res, 200, { count });
    }
    if (req.method === "GET") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
      if (!db) return sendJson(res, 200, []);
      const eventId = req.query?.event_id ? sanitize(req.query.event_id, 64) : null;
      const query = eventId ? { event_id: eventId } : {};
      const regs = await db.collection("registrations").find(query).sort({ created_at: -1 }).toArray();
      return sendJson(res, 200, regs.map(r => ({ ...r, id: String(r._id) })));
    }
    if (req.method === "POST") {
      if (!db) return sendJson(res, 503, { error: "Database service unavailable." });
      const body = await readBody(req, 10 * 1024 * 1024);
      const eventId = sanitize(body.event_id, 64);
      if (!eventId) return sendJson(res, 400, { error: "Missing event_id" });
      const name = sanitize(body.name, 200);
      const email = sanitize(body.email, 320).toLowerCase();
      const transactionId = body.transaction_id ? sanitize(body.transaction_id, 200) : null;
      if (transactionId) {
        const normalised = transactionId.toLowerCase().replace(/\s+/g, "");
        const existing = await db.collection("registrations").findOne({ transaction_id_normalised: normalised });
        if (existing) return sendJson(res, 409, { error: "DUPLICATE_TRANSACTION_ID", message: "ID already used." });
      }
      await db.collection("registrations").insertOne({
        event_id: eventId, name, email,
        transaction_id: transactionId,
        transaction_id_normalised: transactionId ? transactionId.toLowerCase().replace(/\s+/g, "") : null,
        created_at: new Date().toISOString(),
      });
      return sendJson(res, 201, { ok: true });
    }
    res.setHeader("Allow", ["GET", "POST"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("[registrations] error:", err instanceof Error ? err.message : String(err));
    if (req.method === "GET") return sendJson(res, 200, []);
    if (!res.headersSent) sendJson(res, 500, { error: "An internal server error occurred." });
  }
}
