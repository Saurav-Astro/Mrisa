import type { IncomingMessage, ServerResponse } from "http";
import { getMongoDb } from "./_lib/mongo.js";
import {
  applySecurityHeaders,
  checkRateLimit,
  readBodySecure,
  sanitizeString,
  sanitizeEmail,
  sendInternalError,
} from "./_lib/security.js";

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  applySecurityHeaders(res);

  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    // Rate limit: 5 messages per IP per 10 minutes (prevents contact form spam)
    if (!checkRateLimit(req, res, "POST:/api/contact_messages", { limit: 5, windowMs: 10 * 60 * 1000 })) return;

    const body = await readBodySecure(req, res, 16 * 1024); // max 16 KB
    if (!body) return;

    const name = sanitizeString(body.name, 200);
    const email = sanitizeEmail(body.email);
    const message = sanitizeString(body.message, 5000);

    if (!name || !email || !message) {
      return sendJson(res, 400, { error: "Missing required contact fields" });
    }

    const db = await getMongoDb();
    await db.collection("contact_messages").insertOne({
      name,
      email,
      message,
      created_at: new Date().toISOString(),
    });

    return sendJson(res, 201, { ok: true });
  } catch (error) {
    sendInternalError(res, error, "contact_messages");
  }
}
