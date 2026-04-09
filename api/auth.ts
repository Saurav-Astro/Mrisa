import type { IncomingMessage, ServerResponse } from "http";
import { createAdminToken, findAdminUser, getBearerToken, validateAdminPassword, verifyAdminToken } from "./_lib/auth.js";
import { applySecurityHeaders, checkRateLimit, readBodySecure, sanitizeEmail, sanitizeString, sendInternalError } from "./_lib/security.js";

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

export default async function handler(
  req: IncomingMessage & { body?: unknown; headers: Record<string, string | string[] | undefined> },
  res: ServerResponse
) {
  applySecurityHeaders(res);

  try {
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

    if (req.method === "POST") {
      // ── Rate limit: 10 login attempts per IP per 15 minutes ──
      if (!checkRateLimit(req, res, "POST:/api/auth", { limit: 10, windowMs: 15 * 60 * 1000 })) return;

      const body = await readBodySecure(req, res, 2 * 1024); // max 2 KB for login
      if (!body) return;

      const email = sanitizeEmail(body.email);
      const password = sanitizeString(body.password, 256);

      if (!email || !password) {
        return sendJson(res, 400, { error: "Email and password are required" });
      }

      // Bootstrap credentials from env
      const bootstrapEmail = String(process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_EMAIL || "").toLowerCase().trim();
      const bootstrapPassword = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSWORD || "");

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

      const user = await findAdminUser(email);

      // Use constant-time comparison path even on missing user to prevent timing attacks
      if (!user || user.role !== "admin" || !validateAdminPassword(password, user.password_hash)) {
        // Generic error — don't reveal whether email exists
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
    }

    if (req.method === "DELETE") {
      return sendJson(res, 200, { ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendInternalError(res, error, "auth");
  }
}
