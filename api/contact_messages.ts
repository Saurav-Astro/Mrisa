import type { IncomingMessage, ServerResponse } from "http";
import { getMongoDb } from "./_lib/mongo.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") return res.end("{}");
  const db = await getMongoDb();
  if (!db) { res.statusCode = 503; return res.end(JSON.stringify({ error: "Service unavailable" })); }
  let b: any = {}; try { let r = ""; for await (const c of req) r += c; b = JSON.parse(r || "{}"); } catch { }
  await db.collection("contact_messages").insertOne({ ...b, created_at: new Date().toISOString() });
  return res.end(JSON.stringify({ ok: true }));
}
