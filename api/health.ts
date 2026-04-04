import type { IncomingMessage, ServerResponse } from "http";
import { getMongoDb } from "./_lib/mongo.js";

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const db = await getMongoDb();
    await db.command({ ping: 1 });

    const [events, winners, registrations, contactMessages, adminUsers] = await Promise.all([
      db.collection("events").countDocuments(),
      db.collection("winners").countDocuments(),
      db.collection("registrations").countDocuments(),
      db.collection("contact_messages").countDocuments(),
      db.collection("admin_users").countDocuments(),
    ]);

    return sendJson(res, 200, {
      ok: true,
      service: "mrisa-api",
      database: db.databaseName,
      timestamp: new Date().toISOString(),
      collections: {
        admin_users: adminUsers,
        events,
        winners,
        registrations,
        contact_messages: contactMessages,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Health check failed";
    return sendJson(res, 500, { ok: false, error: message });
  }
}
