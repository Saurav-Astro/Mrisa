import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./_lib/mongo.js";
import { verifyToken } from "./_lib/auth.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
  const db = await getMongoDb();
  const col = db?.collection("registrations");
  const q = (req as any).query || {};

  if (req.method === "GET") {
    if (!col) return res.end(q.count ? '{"count":0}' : "[]");
    
    const filter: any = {};
    if (q.event_id) filter.event_id = q.event_id;

    if (q.count) {
        const count = await col.countDocuments(filter);
        return res.end(JSON.stringify({ count }));
    }

    // Admin check for full registration list
    const auth = verifyToken(req.headers.authorization?.split(" ")[1]);
    if (!auth) { res.statusCode = 401; return res.end('{"error":"Unauth"}'); }

    const items = await col.find(filter).sort({ created_at: -1 }).toArray();
    return res.end(JSON.stringify(items.map(i => ({ ...i, id: i._id.toString() }))));
  }

  if (req.method === "POST") {
    if (!col) { res.statusCode = 500; return res.end('{"error":"No DB"}'); }
    let b: any = {}; try { let r = ""; for await (const c of req) r += c; b = JSON.parse(r || "{}"); } catch { }
    const doc = { ...b, created_at: new Date().toISOString() };
    if (doc.transaction_id) {
        const norm = doc.transaction_id.toLowerCase().replace(/\s+/g, "");
        const ex = await col.findOne({ t_norm: norm });
        if (ex) { res.statusCode = 409; return res.end('{"error":"Duplicate"}'); }
        doc.t_norm = norm;
    }
    await col.insertOne(doc);
    return res.end('{"ok":true}');
  }

  if (req.method === "DELETE") {
    const auth = verifyToken(req.headers.authorization?.split(" ")[1]);
    if (!auth) { res.statusCode = 401; return res.end('{"error":"Unauth"}'); }
    if (col && q.id) await col.deleteOne({ _id: new ObjectId(q.id) });
    return res.end('{"ok":true}');
  }
}
