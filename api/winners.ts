import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./_lib/mongo.js";
import { getBearerToken, verifyAdminToken } from "./_lib/auth.js";

interface WinnerDocument {
  _id: unknown;
  event_id: string;
  player_name: string;
  team_name: string | null;
  rank: number;
  image_url: string | null;
  team_members: string | null;
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

const toWinner = (winner: WinnerDocument) => ({
  id: String(winner._id),
  event_id: winner.event_id,
  player_name: winner.player_name,
  team_name: winner.team_name ?? null,
  rank: winner.rank,
  image_url: winner.image_url ?? null,
  team_members: winner.team_members ?? null,
  created_at: winner.created_at,
  updated_at: winner.updated_at,
});

const requireAdmin = (req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }) => {
  const token = getBearerToken(req.headers.authorization as string | undefined);
  const session = verifyAdminToken(token);
  return Boolean(session);
};

export default async function handler(req: IncomingMessage & { body?: unknown; query?: Record<string, string | string[]>; headers: Record<string, string | string[] | undefined> }, res: ServerResponse) {
  try {
    const db = await getMongoDb();
    const winners = db.collection<WinnerDocument>("winners");

    if (req.method === "GET") {
      const items = await winners.find({}).sort({ rank: 1, created_at: -1 }).toArray();
      return sendJson(res, 200, items.map(toWinner));
    }

    if (!requireAdmin(req)) {
      return sendJson(res, 401, { error: "Authentication required" });
    }

    if (req.method === "POST") {
      const body = (await readBody(req)) as Record<string, unknown>;
      const now = new Date().toISOString();

      const payload = {
        event_id: String(body.event_id || "").trim(),
        player_name: String(body.player_name || "").trim(),
        team_name: body.team_name ? String(body.team_name).trim() : null,
        rank: Number(body.rank) || 0,
        image_url: body.image_url ? String(body.image_url).trim() : null,
        team_members: body.team_members ? String(body.team_members).trim() : null,
        created_at: now,
        updated_at: now,
      };

      if (!payload.event_id || !payload.player_name || payload.rank < 1) {
        return sendJson(res, 400, { error: "Missing required winner fields" });
      }

      await winners.insertOne(payload);
      return sendJson(res, 201, { ok: true });
    }

    if (req.method === "PUT") {
      const body = (await readBody(req)) as Record<string, unknown>;
      const id = String(body.id || "");

      if (!id) {
        return sendJson(res, 400, { error: "Missing winner id" });
      }

      const update = {
        event_id: String(body.event_id || "").trim(),
        player_name: String(body.player_name || "").trim(),
        team_name: body.team_name ? String(body.team_name).trim() : null,
        rank: Number(body.rank) || 0,
        image_url: body.image_url ? String(body.image_url).trim() : null,
        team_members: body.team_members ? String(body.team_members).trim() : null,
        updated_at: new Date().toISOString(),
      };

      const result = await winners.updateOne({ _id: new ObjectId(id) }, { $set: update });
      if (!result.matchedCount) {
        return sendJson(res, 404, { error: "Winner not found" });
      }

      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      const id = String(req.query?.id || "");
      if (!id) {
        return sendJson(res, 400, { error: "Missing winner id" });
      }

      const result = await winners.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) {
        return sendJson(res, 404, { error: "Winner not found" });
      }

      return sendJson(res, 200, { ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Winners request failed";
    return sendJson(res, 500, { error: message });
  }
}
