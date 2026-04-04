import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./_lib/mongo.js";

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

const parseSeedKey = (headers: IncomingMessage["headers"]) => {
  const value = headers["x-seed-key"];
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const requiredSeedSecret = process.env.SEED_SECRET;
    if (!requiredSeedSecret) {
      return sendJson(res, 500, { error: "SEED_SECRET is not configured" });
    }

    const providedSeedSecret = parseSeedKey(req.headers);
    if (!providedSeedSecret || providedSeedSecret !== requiredSeedSecret) {
      return sendJson(res, 401, { error: "Unauthorized seed request" });
    }

    const db = await getMongoDb();
    const meta = db.collection("app_meta");
    const seedMarkerId = "sample_seed_v1";

    const existingMarker = await meta.findOne({ _id: seedMarkerId });
    if (existingMarker) {
      return sendJson(res, 409, { error: "Sample seed already executed" });
    }

    const eventsCollection = db.collection("events");
    const winnersCollection = db.collection("winners");

    const now = new Date();
    const nowIso = now.toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const tenDaysAhead = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const eventsResult = await eventsCollection.insertMany([
      {
        title: "MRISA CTF Spring Finals",
        description: "Advanced web, reverse engineering, and forensics challenges.",
        date: twoWeeksAgo,
        time: "10:00",
        location: "MRIIRS Cyber Lab",
        status: "past",
        attendees: 120,
        image_url: null,
        registration_link: null,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        title: "MRISA Capture Night",
        description: "Beginner-friendly attack-defense event for new members.",
        date: tenDaysAhead,
        time: "18:00",
        location: "Online",
        status: "upcoming",
        attendees: 0,
        image_url: null,
        registration_link: "https://mrisa.org/register",
        created_at: nowIso,
        updated_at: nowIso,
      },
    ]);

    const pastEventId = String(eventsResult.insertedIds[0]);

    await winnersCollection.insertMany([
      {
        event_id: pastEventId,
        player_name: "Aarav Mehta",
        team_name: "NullPointers",
        rank: 1,
        image_url: null,
        team_members: "Ira Sharma\nRohan Malik",
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        event_id: pastEventId,
        player_name: "Naina Kapoor",
        team_name: "ByteBandits",
        rank: 2,
        image_url: null,
        team_members: "Karan Arora\nMihir Jain",
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        event_id: pastEventId,
        player_name: "Dev Verma",
        team_name: null,
        rank: 3,
        image_url: null,
        team_members: null,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ]);

    await meta.insertOne({
      _id: seedMarkerId,
      applied_at: nowIso,
      events_inserted: 2,
      winners_inserted: 3,
    });

    return sendJson(res, 201, {
      ok: true,
      seeded: true,
      events_inserted: 2,
      winners_inserted: 3,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed request failed";
    return sendJson(res, 500, { error: message });
  }
}
