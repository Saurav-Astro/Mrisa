import type { IncomingMessage, ServerResponse } from "http";
import { getMongoDb } from "./_lib/mongo.js";
import { signToken, verifyPassword } from "./_lib/auth.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");

  // GET /api/auth — check if current token is still valid (used by loadAdminSession)
  if (req.method === "GET") {
    const auth = (req as any).headers?.authorization || "";
    const token = auth.replace("Bearer ", "").trim();
    if (!token) { res.statusCode = 401; return res.end(JSON.stringify({ error: "No token" })); }
    // Token is validated client-side via parseToken; just return OK here so it doesn't 404
    return res.end(JSON.stringify({ ok: true }));
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  // Parse body
  let body: any = {};
  try {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    body = JSON.parse(raw || "{}");
  } catch { /* ignore */ }

  const email = (body.email || "").toLowerCase().trim();
  const password = body.password || "";

  if (!email || !password) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Email and password are required" }));
  }

  // 1. Check against bootstrap admin env vars
  const bootstrapEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || "").toLowerCase();
  const bootstrapPass = process.env.ADMIN_BOOTSTRAP_PASSWORD || "";

  if (bootstrapEmail && email === bootstrapEmail && password === bootstrapPass) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hrs
    const token = signToken({ email: bootstrapEmail, role: "admin" });
    return res.end(JSON.stringify({
      email: bootstrapEmail,
      token,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }));
  }

  // 2. Try database admin_users collection
  const db = await getMongoDb();
  if (db) {
    const user = await db.collection("admin_users").findOne({ email });
    if (user && verifyPassword(password, user.password_hash)) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const token = signToken({ email: user.email, role: user.role || "admin" });
      return res.end(JSON.stringify({
        email: user.email,
        token,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      }));
    }
  }

  res.statusCode = 401;
  return res.end(JSON.stringify({ error: "Invalid email or password" }));
}
