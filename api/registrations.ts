import type { IncomingMessage, ServerResponse } from "http";
import { getMongoDb } from "./_lib/mongo.js";

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

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const body = (await readBody(req)) as Record<string, unknown>;
    const eventId = String(body.event_id || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const teamName = body.team_name ? String(body.team_name).trim() : null;

    if (!eventId || !name || !email) {
      return sendJson(res, 400, { error: "Missing required registration fields" });
    }

    const db = await getMongoDb();
    await db.collection("registrations").insertOne({
      event_id: eventId,
      name,
      email,
      team_name: teamName,
      created_at: new Date().toISOString(),
    });

    return sendJson(res, 201, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration request failed";
    return sendJson(res, 500, { error: message });
  }
}
