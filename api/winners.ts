import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./_lib/mongo.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
  const db = await getMongoDb();
  const col = db?.collection("winners");

  const url = new URL(req.url || "", "http://localhost");
  const q = Object.fromEntries(url.searchParams.entries());

  if (req.method === "GET") {
    if (!col) return res.end("[]");
    try {
      const filter: any = {};
      if (q.event_id) filter.event_id = q.event_id;
      const items = await col.find(filter).sort({ rank: 1 }).toArray();
      return res.end(JSON.stringify(items.map(i => ({ ...i, id: i._id.toString() }))));
    } catch { return res.end("[]"); }
  }

  if (!col) { res.statusCode = 503; return res.end('{"error":"No DB"}'); }
  let body: any = {};
  try { let r = ""; for await (const c of req) r += c; body = JSON.parse(r || "{}"); } catch { }

  if (req.method === "POST") {
    const doc = { ...body, created_at: new Date().toISOString() };
    delete doc.id; delete doc._id;
    await col.insertOne(doc);
    return res.end('{"ok":true}');
  }
  if (req.method === "PUT") {
    const id = body.id || q.id;
    if (!id) { res.statusCode = 400; return res.end('{"error":"No ID"}'); }
    const update = { ...body, updated_at: new Date().toISOString() };
    delete update.id; delete update._id;
    await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
    return res.end('{"ok":true}');
  }
  if (req.method === "DELETE") {
    const id = q.id || body.id;
    if (!id) { res.statusCode = 400; return res.end('{"error":"No ID"}'); }
    await col.deleteOne({ _id: new ObjectId(id) });
    return res.end('{"ok":true}');
  }

  res.statusCode = 405;
  return res.end('{"error":"Method not allowed"}');
}