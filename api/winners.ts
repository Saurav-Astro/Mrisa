import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./_lib/mongo.js";
import { verifyToken } from "./_lib/auth.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const db = await getMongoDb();
  const auth = verifyToken(req.headers.authorization?.split(" ")[1]);

  if (req.method === "GET") {
    if (!db) return res.end(JSON.stringify([]));
    const items = await db.collection("winners").find().sort({ rank: 1 }).toArray();
    return res.end(JSON.stringify(items.map(i => ({ ...i, id: i._id.toString() }))));
  }

  if (!auth) { res.statusCode = 401; return res.end(JSON.stringify({ error: "Unauthorized" })); }
  if (!db) { res.statusCode = 500; return res.end(JSON.stringify({ error: "No DB" })); }
  const col = db.collection("winners");

  let body: any = {};
  try { let r = ""; for await (const c of req) r += c; body = JSON.parse(r || "{}"); } catch { }

  if (req.method === "POST") {
    await col.insertOne({ ...body, created_at: new Date().toISOString() });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (req.method === "PUT") {
    const id = body.id;
    const update = { ...body }; delete update.id; delete update._id;
    await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (req.method === "DELETE") {
    const id = (req as any).query?.id;
    await col.deleteOne({ _id: new ObjectId(id) });
    return res.end(JSON.stringify({ ok: true }));
  }
}
