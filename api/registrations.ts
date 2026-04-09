import type { IncomingMessage, ServerResponse } from "http";
import { getMongoDb } from "./_lib/mongo.js";
import { getBearerToken, verifyAdminToken } from "./_lib/auth.js";
import { ObjectId } from "mongodb";

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

const requireAdmin = (req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }) => {
  const token = getBearerToken(req.headers.authorization as string | undefined);
  const session = verifyAdminToken(token);
  return Boolean(session);
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

export default async function handler(req: IncomingMessage & { body?: unknown; query?: Record<string, string | string[]>; headers: Record<string, string | string[] | undefined> }, res: ServerResponse) {
  try {
    const db = await getMongoDb(0);
    const collection = db.collection("registrations");

    if (req.method === "GET") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
      const eventId = req.query?.event_id;
      const query = eventId ? { event_id: String(eventId) } : {};
      const regs = await collection.find(query).sort({ created_at: -1 }).toArray();
      return sendJson(res, 200, regs.map(r => ({ ...r, id: String(r._id) })));
    }

    if (req.method === "DELETE") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
      const id = String(req.query?.id || "");
      if (!id) return sendJson(res, 400, { error: "Missing registration id" });
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) return sendJson(res, 404, { error: "Registration not found" });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const body = (await readBody(req)) as Record<string, unknown>;
    const eventId = String(body.event_id || "").trim();
    
    if (!eventId) {
      return sendJson(res, 400, { error: "Missing event_id" });
    }

    const payload = {
      ...body,
      event_id: eventId,
      created_at: new Date().toISOString(),
    };

    await collection.insertOne(payload);
    return sendJson(res, 201, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration request failed";
    return sendJson(res, 500, { error: message });
  }
}