import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import type { WithId } from "mongodb";
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

const readBody = async (req: IncomingMessage & { body?: unknown }): Promise<Record<string, unknown>> => {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  if (typeof req.body === "string") { try { return JSON.parse(req.body || "{}"); } catch { return {}; } }
  let raw = ""; let bytes = 0;
  for await (const chunk of req) {
    bytes += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk as string);
    if (bytes > 10 * 1024 * 1024) return {};
    raw += chunk;
  }
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};

const requireAdmin = (req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }) =>
  Boolean(verifyAdminToken(getBearerToken(req.headers.authorization as string | undefined)));

interface EventDocument {
  title: string; description: string; date: string; time: string; location: string;
  status: "upcoming" | "active" | "past"; attendees: number;
  image_url: string | null; registration_link: string | null;
  registration_open?: boolean; registration_type?: "paid" | "unpaid";
  payment_qr_url?: string | null; payment_link?: string | null;
  payment_instructions?: string | null; participation_type?: "solo" | "team";
  team_min_members?: number | null; team_max_members?: number | null;
  team_enforce_details?: boolean; form_fields?: any[];
  created_at: string; updated_at: string;
}

const toEvent = (e: WithId<EventDocument>) => ({
  id: String(e._id), title: e.title, description: e.description, date: e.date,
  time: e.time, location: e.location, status: e.status, attendees: e.attendees ?? 0,
  image_url: e.image_url ?? null, registration_link: e.registration_link ?? null,
  registration_open: e.registration_open ?? true,
  registration_type: e.registration_type ?? "unpaid",
  payment_qr_url: e.payment_qr_url ?? null, payment_link: e.payment_link ?? null,
  payment_instructions: e.payment_instructions ?? null,
  participation_type: e.participation_type ?? "solo",
  team_min_members: e.team_min_members ?? null, team_max_members: e.team_max_members ?? null,
  team_enforce_details: e.team_enforce_details ?? false, form_fields: e.form_fields ?? [],
  created_at: e.created_at, updated_at: e.updated_at,
});

export default async function handler(
  req: IncomingMessage & { body?: unknown; query?: Record<string, string | string[]>; headers: Record<string, string | string[] | undefined> },
  res: ServerResponse
) {
  try {
    const db = await getMongoDb();
    if (req.method === "GET") {
      if (!db) return sendJson(res, 200, []); 
      const collection = db.collection<EventDocument>("events");
      const items = await collection.find({}).sort({ date: -1, created_at: -1 }).toArray();
      return sendJson(res, 200, items.map(toEvent));
    }
    if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
    if (!db) return sendJson(res, 503, { error: "Database service unavailable." });
    const collection = db.collection<EventDocument>("events");
    if (req.method === "POST") {
      const body = await readBody(req);
      const now = new Date().toISOString();
      const payload: EventDocument = {
        title: sanitize(body.title, 200), description: sanitize(body.description, 5000),
        date: sanitize(body.date, 50), time: sanitize(body.time, 50),
        location: sanitize(body.location, 300),
        status: body.status === "active" || body.status === "past" ? body.status : "upcoming",
        attendees: Number.isFinite(Number(body.attendees)) ? Number(body.attendees) : 0,
        image_url: body.image_url ? sanitize(body.image_url, 10000) : null,
        registration_link: body.registration_link ? sanitize(body.registration_link, 2048) : null,
        registration_open: body.registration_open !== false,
        registration_type: body.registration_type === "paid" ? "paid" : "unpaid",
        payment_qr_url: body.payment_qr_url ? String(body.payment_qr_url).slice(0, 2 * 1024 * 1024) : null,
        payment_link: body.payment_link ? sanitize(body.payment_link, 2048) : null,
        payment_instructions: body.payment_instructions ? sanitize(body.payment_instructions, 2000) : null,
        participation_type: body.participation_type === "team" ? "team" : "solo",
        team_min_members: Number.isFinite(Number(body.team_min_members)) ? Number(body.team_min_members) : null,
        team_max_members: Number.isFinite(Number(body.team_max_members)) ? Number(body.team_max_members) : null,
        team_enforce_details: Boolean(body.team_enforce_details),
        form_fields: Array.isArray(body.form_fields) ? body.form_fields.slice(0, 100) : [],
        created_at: now, updated_at: now,
      };
      if (!payload.title || !payload.description || !payload.date || !payload.time || !payload.location)
        return sendJson(res, 400, { error: "Missing required event fields" });
      await collection.insertOne(payload);
      return sendJson(res, 201, { ok: true });
    }
    if (req.method === "PUT") {
      const body = await readBody(req);
      const id = sanitize(body.id, 64);
      if (!id || !isValidId(id)) return sendJson(res, 400, { error: "Invalid event ID" });
      const update = {
        title: sanitize(body.title, 200), description: sanitize(body.description, 5000),
        date: sanitize(body.date, 50), time: sanitize(body.time, 50),
        location: sanitize(body.location, 300),
        status: body.status === "active" || body.status === "past" ? body.status : "upcoming",
        attendees: Number.isFinite(Number(body.attendees)) ? Number(body.attendees) : 0,
        image_url: body.image_url ? sanitize(body.image_url, 10000) : null,
        registration_link: body.registration_link ? sanitize(body.registration_link, 2048) : null,
        registration_open: body.registration_open !== false,
        registration_type: body.registration_type === "paid" ? "paid" : "unpaid",
        payment_qr_url: body.payment_qr_url ? String(body.payment_qr_url).slice(0, 2 * 1024 * 1024) : null,
        payment_link: body.payment_link ? sanitize(body.payment_link, 2048) : null,
        payment_instructions: body.payment_instructions ? sanitize(body.payment_instructions, 2000) : null,
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
      const id = sanitize(req.query?.id, 64);
      if (!id || !isValidId(id)) return sendJson(res, 400, { error: "Invalid event ID" });
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) return sendJson(res, 404, { error: "Event not found" });
      return sendJson(res, 200, { ok: true });
    }
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("[events] error:", err instanceof Error ? err.message : String(err));
    if (req.method === "GET") return sendJson(res, 200, []); 
    if (!res.headersSent) sendJson(res, 500, { error: "An internal server error occurred." });
  }
}
