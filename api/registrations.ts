import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./_lib/mongo.js";
import { verifyToken } from "./_lib/auth.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const db = await getMongoDb();
  if (req.method === "GET") {
    const auth = verifyToken(req.headers.authorization?.split(" ")[1]);
    if (!auth) { res.statusCode = 401; return res.end(JSON.stringify({ error: "Auth required" })); }
    if (!db) return res.end(JSON.stringify([]));
    const items = await db.collection("registrations").find().sort({ created_at: -1 }).toArray();
    return res.end(JSON.stringify(items.map(i => ({ ...i, id: i._id.toString() }))));
  }
  if (req.method === "POST") {
    if (!db) { res.statusCode = 500; return res.end(JSON.stringify({ error: "No DB" })); }
    let b: any = {}; try { let r = ""; for await (const c of req) r += c; b = JSON.parse(r || "{}"); } catch { }
    const doc = { ...b, created_at: new Date().toISOString() };
    if (doc.transaction_id) {
        const norm = doc.transaction_id.toLowerCase().replace(/\s+/g, "");
        const ex = await db.collection("registrations").findOne({ t_norm: norm });
        if (ex) { res.statusCode = 409; return res.end(JSON.stringify({ error: "Duplicate" })); }
        doc.t_norm = norm;
    }
    await db.collection("registrations").insertOne(doc);
    return res.end(JSON.stringify({ ok: true }));
  }
}
