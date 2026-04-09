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

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

const toWinner = (winner: WithId<WinnerDocument>) => ({
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
    const winners = db.collection<WinnerDocument>("winners");

    if (req.method === "GET") {
      if (!checkRateLimit(req, res, "GET:/api/winners", { limit: 120, windowMs: 60 * 1000 })) return;
      const items = await winners.find({}).sort({ rank: 1, created_at: -1 }).toArray();
      return sendJson(res, 200, items.map(toWinner));
    }

    if (!requireAdmin(req)) {
      return sendJson(res, 401, { error: "Authentication required" });
    }

    if (!checkRateLimit(req, res, "ADMIN:/api/winners", { limit: 60, windowMs: 60 * 1000 })) return;

    if (req.method === "POST") {
      const body = await readBodySecure(req, res, 512 * 1024); // 512 KB
      if (!body) return;

      const now = new Date().toISOString();
      const payload = {
        event_id: sanitizeString(body.event_id, 64),
        player_name: sanitizeString(body.player_name, 200),
        team_name: body.team_name ? sanitizeString(body.team_name, 200) : null,
        rank: Number.isFinite(Number(body.rank)) ? Number(body.rank) : 0,
        image_url: body.image_url ? sanitizeString(body.image_url, 2048) : null,
        team_members: body.team_members ? sanitizeString(body.team_members, 2000) : null,
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
      const body = await readBodySecure(req, res, 512 * 1024);
      if (!body) return;

      const id = sanitizeString(body.id, 64);
      if (!id || !isValidObjectId(id)) return sendJson(res, 400, { error: "Invalid winner ID" });

      const update = {
        event_id: sanitizeString(body.event_id, 64),
        player_name: sanitizeString(body.player_name, 200),
        team_name: body.team_name ? sanitizeString(body.team_name, 200) : null,
        rank: Number.isFinite(Number(body.rank)) ? Number(body.rank) : 0,
        image_url: body.image_url ? sanitizeString(body.image_url, 2048) : null,
        team_members: body.team_members ? sanitizeString(body.team_members, 2000) : null,
        updated_at: new Date().toISOString(),
      };

      const result = await winners.updateOne({ _id: new ObjectId(id) }, { $set: update });
      if (!result.matchedCount) return sendJson(res, 404, { error: "Winner not found" });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      const id = sanitizeString(req.query?.id, 64);
      if (!id || !isValidObjectId(id)) return sendJson(res, 400, { error: "Invalid winner ID" });

      const result = await winners.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) return sendJson(res, 404, { error: "Winner not found" });
      return sendJson(res, 200, { ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendInternalError(res, error, "winners");
  }
}
