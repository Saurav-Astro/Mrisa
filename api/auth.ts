import type { IncomingMessage, ServerResponse } from "http";
import { getMongoDb } from "./_lib/mongo.js";
import { signToken, verifyPassword } from "./_lib/auth.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") return res.end("{}");
  let b: any = {}; try { let r = ""; for await (const c of req) r += c; b = JSON.parse(r || "{}"); } catch { }
  
  const email = b.email?.toLowerCase().trim();
  const pass = b.password;

  const bootEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_EMAIL;
  const bootPass = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSWORD;

  if (email === bootEmail?.toLowerCase() && pass === bootPass) {
    return res.end(JSON.stringify({ token: signToken({ email: bootEmail, role: "admin" }) }));
  }

  const db = await getMongoDb();
  if (!db) { res.statusCode = 401; return res.end(JSON.stringify({ error: "Auth failed" })); }
  const user = await db.collection("admin_users").findOne({ email });
  if (user && verifyPassword(pass, user.password_hash)) {
    return res.end(JSON.stringify({ token: signToken({ email: user.email, role: user.role }) }));
  }

  res.statusCode = 401;
  return res.end(JSON.stringify({ error: "Invalid credentials" }));
}
