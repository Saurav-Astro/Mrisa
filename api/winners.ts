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
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};

const requireAdmin = (req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }) =>
  Boolean(verifyAdminToken(getBearerToken(req.headers.authorization as string | undefined)));

interface WinnerDocument {
  event_id: string;
  player_name: string;
  team_name: string | null;
  rank: number;
  image_url: string | null;
  team_members: string | null;
  created_at: string;
  updated_at: string;
}

const toWinner = (w: WithId<WinnerDocument>) => ({
  id: String(w._id),
  event_id: w.event_id,
  player_name: w.player_name,
  team_name: w.team_name ?? null,
  rank: w.rank,
  image_url: w.image_url ?? null,
  team_members: w.team_members ?? null,
  created_at: w.created_at,
  updated_at: w.updated_at,
});

export default async function handler(
  req: IncomingMessage & { body?: unknown; query?: Record<string, string | string[]>; headers: Record<string, string | string[] | undefined> },
  res: ServerResponse
) {
  try {
    const db = await getMongoDb();
    if (req.method === "GET") {
      if (!db) return sendJson(res, 200, []);
      const collection = db.collection<WinnerDocument>("winners");
      const items = await collection.find({}).sort({ rank: 1, created_at: -1 }).toArray();
      return sendJson(res, 200, items.map(toWinner));
    }
    if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
    if (!db) return sendJson(res, 503, { error: "Database service unavailable." });
    const collection = db.collection<WinnerDocument>("winners");
    if (req.method === "POST") {
      const body = await readBody(req);
      const now = new Date().toISOString();
      const payload: WinnerDocument = {
        event_id: sanitize(body.event_id, 64),
        player_name: sanitize(body.player_name, 200),
        team_name: body.team_name ? sanitize(body.team_name, 200) : null,
        rank: Number.isFinite(Number(body.rank)) ? Number(body.rank) : 0,
        image_url: body.image_url ? sanitize(body.image_url, 2048) : null,
        team_members: body.team_members ? sanitize(body.team_members, 2000) : null,
        created_at: now,
        updated_at: now,
      };
      if (!payload.event_id || !payload.player_name || payload.rank < 1)
        return sendJson(res, 400, { error: "Missing required winner fields" });
      await collection.insertOne(payload);
      return sendJson(res, 201, { ok: true });
    }
    if (req.method === "PUT") {
      const body = await readBody(req);
      const id = sanitize(body.id, 64);
      if (!id || !isValidId(id)) return sendJson(res, 400, { error: "Invalid winner ID" });
      const update = {
        event_id: sanitize(body.event_id, 64),
        player_name: sanitize(body.player_name, 200),
        team_name: body.team_name ? sanitize(body.team_name, 200) : null,
        rank: Number.isFinite(Number(body.rank)) ? Number(body.rank) : 0,
        image_url: body.image_url ? sanitize(body.image_url, 2048) : null,
        team_members: body.team_members ? sanitize(body.team_members, 2000) : null,
        updated_at: new Date().toISOString(),
      };
      const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
      if (!result.matchedCount) return sendJson(res, 404, { error: "Winner not found" });
      return sendJson(res, 200, { ok: true });
    }
    if (req.method === "DELETE") {
      const id = sanitize(req.query?.id, 64);
      if (!id || !isValidId(id)) return sendJson(res, 400, { error: "Invalid winner ID" });
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) return sendJson(res, 404, { error: "Winner not found" });
      return sendJson(res, 200, { ok: true });
    }
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("[winners] error:", err instanceof Error ? err.message : String(err));
    if (req.method === "GET") return sendJson(res, 200, []);
    if (!res.headersSent) sendJson(res, 500, { error: "An internal server error occurred." });
  }
}
