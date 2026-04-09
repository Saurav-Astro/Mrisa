import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import type { WithId } from "mongodb";
import { getMongoDb } from "./_lib/mongo.js";
import { getBearerToken, verifyAdminToken } from "./_lib/auth.js";
import {
  applySecurityHeaders,
  checkRateLimit,
  readBodySecure,
  sanitizeString,
  isValidObjectId,
  sendInternalError,
} from "./_lib/security.js";

interface EventDocument {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "active" | "past";
  attendees: number;
  image_url: string | null;
  registration_link: string | null;
  registration_open?: boolean;
  registration_type?: "paid" | "unpaid";
  payment_qr_url?: string | null;
  payment_link?: string | null;
  payment_instructions?: string | null;
  participation_type?: "solo" | "team";
  team_min_members?: number | null;
  team_max_members?: number | null;
  team_enforce_details?: boolean;
  form_fields?: any[];
  created_at: string;
  updated_at: string;
}

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

const toEvent = (event: WithId<EventDocument>) => ({
  id: String(event._id),
  title: event.title,
  description: event.description,
  date: event.date,
  time: event.time,
  location: event.location,
  status: event.status,
  attendees: event.attendees ?? 0,
  image_url: event.image_url ?? null,
  registration_link: event.registration_link ?? null,
  registration_open: event.registration_open ?? true,
  registration_type: event.registration_type ?? "unpaid",
  payment_qr_url: event.payment_qr_url ?? null,
  payment_link: event.payment_link ?? null,
  payment_instructions: event.payment_instructions ?? null,
  participation_type: event.participation_type ?? "solo",
  team_min_members: event.team_min_members ?? null,
  team_max_members: event.team_max_members ?? null,
  team_enforce_details: event.team_enforce_details ?? false,
  form_fields: event.form_fields ?? [],
  created_at: event.created_at,
  updated_at: event.updated_at,
});

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
    const collection = db.collection<EventDocument>("events");

    if (req.method === "GET") {
      // Public — moderate rate limit (120/min)
      if (!checkRateLimit(req, res, "GET:/api/events", { limit: 120, windowMs: 60 * 1000 })) return;
      const events = await collection.find({}).sort({ date: -1, created_at: -1 }).toArray();
      return sendJson(res, 200, events.map(toEvent));
    }

    if (!requireAdmin(req)) {
      return sendJson(res, 401, { error: "Authentication required" });
    }

    // Admin routes rate limit (60/min)
    if (!checkRateLimit(req, res, "ADMIN:/api/events", { limit: 60, windowMs: 60 * 1000 })) return;

    if (req.method === "POST") {
      // Max 6 MB — covers base64 QR images
      const body = await readBodySecure(req, res, 6 * 1024 * 1024);
      if (!body) return;

      const now = new Date().toISOString();
      const payload: EventDocument = {
        title: sanitizeString(body.title, 200),
        description: sanitizeString(body.description, 5000),
        date: sanitizeString(body.date, 50),
        time: sanitizeString(body.time, 50),
        location: sanitizeString(body.location, 300),
        status: body.status === "active" || body.status === "past" ? body.status : "upcoming",
        attendees: Number.isFinite(Number(body.attendees)) ? Number(body.attendees) : 0,
        image_url: body.image_url ? sanitizeString(body.image_url, 10000) : null,
        registration_link: body.registration_link ? sanitizeString(body.registration_link, 2048) : null,
        registration_open: body.registration_open !== false,
        registration_type: body.registration_type === "paid" ? "paid" : "unpaid",
        payment_qr_url: body.payment_qr_url ? String(body.payment_qr_url).slice(0, 2 * 1024 * 1024) : null,
        payment_link: body.payment_link ? sanitizeString(body.payment_link, 2048) : null,
        payment_instructions: body.payment_instructions ? sanitizeString(body.payment_instructions, 2000) : null,
        participation_type: body.participation_type === "team" ? "team" : "solo",
        team_min_members: Number.isFinite(Number(body.team_min_members)) ? Number(body.team_min_members) : null,
        team_max_members: Number.isFinite(Number(body.team_max_members)) ? Number(body.team_max_members) : null,
        team_enforce_details: Boolean(body.team_enforce_details),
        form_fields: Array.isArray(body.form_fields) ? body.form_fields.slice(0, 100) : [],
        created_at: now,
        updated_at: now,
      };

      if (!payload.title || !payload.description || !payload.date || !payload.time || !payload.location) {
        return sendJson(res, 400, { error: "Missing required event fields" });
      }

      await collection.insertOne(payload);
      return sendJson(res, 201, { ok: true });
    }

    if (req.method === "PUT") {
      const body = await readBodySecure(req, res, 6 * 1024 * 1024);
      if (!body) return;

      const id = sanitizeString(body.id, 64);
      if (!id || !isValidObjectId(id)) return sendJson(res, 400, { error: "Invalid event ID" });

      const update: Partial<EventDocument> & { updated_at: string } = {
        title: sanitizeString(body.title, 200),
        description: sanitizeString(body.description, 5000),
        date: sanitizeString(body.date, 50),
        time: sanitizeString(body.time, 50),
        location: sanitizeString(body.location, 300),
        status: body.status === "active" || body.status === "past" ? body.status : "upcoming",
        attendees: Number.isFinite(Number(body.attendees)) ? Number(body.attendees) : 0,
        image_url: body.image_url ? sanitizeString(body.image_url, 10000) : null,
        registration_link: body.registration_link ? sanitizeString(body.registration_link, 2048) : null,
        registration_open: body.registration_open !== false,
        registration_type: body.registration_type === "paid" ? "paid" : "unpaid",
        payment_qr_url: body.payment_qr_url ? String(body.payment_qr_url).slice(0, 2 * 1024 * 1024) : null,
        payment_link: body.payment_link ? sanitizeString(body.payment_link, 2048) : null,
        payment_instructions: body.payment_instructions ? sanitizeString(body.payment_instructions, 2000) : null,
        participation_type: body.participation_type === "team" ? "team" : "solo",
        team_min_members: Number.isFinite(Number(body.team_min_members)) ? Number(body.team_min_members) : null,
        team_max_members: Number.isFinite(Number(body.team_max_members)) ? Number(body.team_max_members) : null,
        team_enforce_details: Boolean(body.team_enforce_details),
        form_fields: Array.isArray(body.form_fields) ? body.form_fields.slice(0, 100) : [],
        updated_at: new Date().toISOString(),
      };

      const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
      if (!result.matchedCount) return sendJson(res, 404, { error: "Event not found" });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      const id = sanitizeString(req.query?.id, 64);
      if (!id || !isValidObjectId(id)) return sendJson(res, 400, { error: "Invalid event ID" });

      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) return sendJson(res, 404, { error: "Event not found" });
      return sendJson(res, 200, { ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendInternalError(res, error, "events");
  }
}
