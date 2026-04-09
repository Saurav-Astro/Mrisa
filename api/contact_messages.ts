import type { IncomingMessage, ServerResponse } from "http";
import { getMongoDb } from "./_lib/mongo.js";

const sendJson = (res: ServerResponse, code: number, data: unknown) => {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.end(JSON.stringify(data));
};

const sanitize = (v: unknown, max = 1000): string =>
  String(v ?? "").trim().replace(/<[^>]*>/g, "").replace(/\0/g, "").slice(0, max);

const readBody = async (req: IncomingMessage & { body?: unknown }): Promise<Record<string, unknown>> => {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  if (typeof req.body === "string") { try { return JSON.parse(req.body || "{}"); } catch { return {}; } }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
    const db = await getMongoDb();
    if (!db) return sendJson(res, 503, { error: "Service unavailable." });
    const body = await readBody(req);
    const name = sanitize(body.name, 200);
    const email = sanitize(body.email, 320);
    const message = sanitize(body.message, 5000);
    if (!name || !email || !message) return sendJson(res, 400, { error: "Missing fields" });
    await db.collection("contact_messages").insertOne({ name, email, message, created_at: new Date().toISOString() });
    return sendJson(res, 201, { ok: true });
  } catch (err) {
    console.error("[contact] error:", err);
    if (!res.headersSent) sendJson(res, 500, { error: "Internal error." });
  }
}
