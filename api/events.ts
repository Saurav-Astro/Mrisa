import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./_lib/mongo.js";
import { getBearerToken, verifyAdminToken } from "./_lib/auth.js";

interface EventDocument {
  _id: unknown;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "active" | "past";
  attendees: number;
  image_url: string | null;
  registration_link: string | null;
  created_at: string;
  updated_at: string;
}

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

const readBody = async (req: IncomingMessage & { body?: unknown }) => {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
  }

  return raw ? JSON.parse(raw) : {};
};

const toEvent = (event: EventDocument) => ({
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
  created_at: event.created_at,
  updated_at: event.updated_at,
});

const requireAdmin = (req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }) => {
  const token = getBearerToken(req.headers.authorization as string | undefined);
  const session = verifyAdminToken(token);
  return Boolean(session);
};

export default async function handler(req: IncomingMessage & { body?: unknown; query?: Record<string, string | string[]>; headers: Record<string, string | string[] | undefined> }, res: ServerResponse) {
  try {
    const db = await getMongoDb();
    const collection = db.collection<EventDocument>("events");

    if (req.method === "GET") {
      const events = await collection.find({}).sort({ date: -1, created_at: -1 }).toArray();
      return sendJson(res, 200, events.map(toEvent));
    }

    if (!requireAdmin(req)) {
      return sendJson(res, 401, { error: "Authentication required" });
    }

    if (req.method === "POST") {
      const body = (await readBody(req)) as Record<string, unknown>;
      const now = new Date().toISOString();

      const payload = {
        title: String(body.title || "").trim(),
        description: String(body.description || "").trim(),
        date: String(body.date || "").trim(),
        time: String(body.time || "").trim(),
        location: String(body.location || "").trim(),
        status: body.status === "active" || body.status === "past" ? body.status : "upcoming",
        attendees: Number.isFinite(Number(body.attendees)) ? Number(body.attendees) : 0,
        image_url: body.image_url ? String(body.image_url).trim() : null,
        registration_link: body.registration_link ? String(body.registration_link).trim() : null,
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
      const body = (await readBody(req)) as Record<string, unknown>;
      const id = String(body.id || "");

      if (!id) {
        return sendJson(res, 400, { error: "Missing event id" });
      }

      const update = {
        title: String(body.title || "").trim(),
        description: String(body.description || "").trim(),
        date: String(body.date || "").trim(),
        time: String(body.time || "").trim(),
        location: String(body.location || "").trim(),
        status: body.status === "active" || body.status === "past" ? body.status : "upcoming",
        attendees: Number.isFinite(Number(body.attendees)) ? Number(body.attendees) : 0,
        image_url: body.image_url ? String(body.image_url).trim() : null,
        registration_link: body.registration_link ? String(body.registration_link).trim() : null,
        updated_at: new Date().toISOString(),
      };

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
      );

      if (!result.matchedCount) {
        return sendJson(res, 404, { error: "Event not found" });
      }

      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      const id = String(req.query?.id || "");
      if (!id) {
        return sendJson(res, 400, { error: "Missing event id" });
      }

      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) {
        return sendJson(res, 404, { error: "Event not found" });
      }

      return sendJson(res, 200, { ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Events request failed";
    return sendJson(res, 500, { error: message });
  }
}
