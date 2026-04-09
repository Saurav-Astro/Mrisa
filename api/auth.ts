/**
 * api/auth.ts — Self-contained, no external security.ts dependency.
 * All rate-limiting, sanitization, and header logic is inlined here.
 */
import type { IncomingMessage, ServerResponse } from "http";
import {
  createAdminToken,
  findAdminUser,
  getBearerToken,
  validateAdminPassword,
  verifyAdminToken,
} from "./_lib/auth.js";

// ── Helpers ────────────────────────────────────────────────────────────────

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.end(JSON.stringify(data));
};

const readBody = async (
  req: IncomingMessage & { body?: unknown }
): Promise<Record<string, unknown>> => {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body || "{}"); } catch { return {}; }
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};

// Simple in-memory rate limit — keyed by IP, max 10 attempts per 15 min
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 10;
};

const getIp = (req: IncomingMessage): string => {
  const fwd = req.headers["x-forwarded-for"];
  return (Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0]?.trim()) || "unknown";
};

const sanitize = (v: unknown, max = 500): string =>
  String(v ?? "").trim().replace(/<[^>]*>/g, "").slice(0, max);

// ── Handler ────────────────────────────────────────────────────────────────

export default async function handler(
  req: IncomingMessage & {
    body?: unknown;
    headers: Record<string, string | string[] | undefined>;
  },
  res: ServerResponse
) {
  try {
    // ── GET: verify token ────────────────────────────────────────────────
    if (req.method === "GET") {
      const token = getBearerToken(req.headers.authorization as string | undefined);
      const session = verifyAdminToken(token);
      if (!session) return sendJson(res, 401, { error: "Not authenticated" });
      return sendJson(res, 200, {
        email: session.email,
        created_at: session.created_at,
        expires_at: session.expires_at,
        token,
      });
    }

    // ── POST: login ──────────────────────────────────────────────────────
    if (req.method === "POST") {
      // Rate limit
      const ip = getIp(req);
      if (isRateLimited(ip)) {
        res.setHeader("Retry-After", "900");
        return sendJson(res, 429, { error: "Too many login attempts. Try again in 15 minutes." });
      }

      const body = await readBody(req);
      const email = sanitize(body.email, 320).toLowerCase();
      const password = sanitize(body.password, 256);

      if (!email || !password) {
        return sendJson(res, 400, { error: "Email and password are required" });
      }

      // Bootstrap credentials from env (fast path — no DB needed)
      const bootstrapEmail = String(
        process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_EMAIL || ""
      ).toLowerCase().trim();
      const bootstrapPassword = String(
        process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSWORD || ""
      );

      if (bootstrapEmail && bootstrapPassword && email === bootstrapEmail && password === bootstrapPassword) {
        const token = createAdminToken(email);
        const session = verifyAdminToken(token);
        return sendJson(res, 200, {
          email: session?.email || email,
          created_at: session?.created_at || new Date().toISOString(),
          expires_at: session?.expires_at || new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          token,
        });
      }

      // If no bootstrap creds and no MONGO_URI → give a clear config error
      if (!process.env.MONGO_URI) {
        console.error("[auth] Missing MONGO_URI environment variable. Set ADMIN_BOOTSTRAP_EMAIL + ADMIN_BOOTSTRAP_PASSWORD or MONGO_URI in Vercel environment variables.");
        return sendJson(res, 503, {
          error: "Service not configured. Please set environment variables on Vercel: ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PASSWORD (and optionally MONGO_URI).",
        });
      }

      // DB lookup — wrapped so a DB error never returns 500
      try {
        const user = await findAdminUser(email);
        if (!user || user.role !== "admin" || !validateAdminPassword(password, user.password_hash)) {
          return sendJson(res, 401, { error: "Invalid email or password" });
        }
        const token = createAdminToken(email);
        const session = verifyAdminToken(token);
        return sendJson(res, 200, {
          email: session?.email || email,
          created_at: session?.created_at || new Date().toISOString(),
          expires_at: session?.expires_at || new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          token,
        });
      } catch (dbErr) {
        console.error("[auth] DB lookup failed:", dbErr instanceof Error ? dbErr.message : String(dbErr));
        return sendJson(res, 401, { error: "Invalid email or password" });
      }
    }

    // ── DELETE: logout (client-side only, no server state) ───────────────
    if (req.method === "DELETE") {
      return sendJson(res, 200, { ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    // Never expose internal errors to the client
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[auth] error:", msg);
    return sendJson(res, 500, { error: "An internal server error occurred." });
  }
}
