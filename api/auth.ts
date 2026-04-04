import type { IncomingMessage, ServerResponse } from "http";
import { createAdminToken, findAdminUser, getBearerToken, validateAdminPassword, verifyAdminToken } from "./_lib/auth.js";

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

const readBody = async (req: IncomingMessage & { body?: unknown }) => {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
  }

  return raw ? JSON.parse(raw) : {};
};

export default async function handler(req: IncomingMessage & { body?: unknown; headers: Record<string, string | string[] | undefined> }, res: ServerResponse) {
  try {
    if (req.method === "GET") {
      const token = getBearerToken(req.headers.authorization as string | undefined);
      const session = verifyAdminToken(token);

      if (!session) {
        return sendJson(res, 401, { error: "Not authenticated" });
      }

      return sendJson(res, 200, {
        email: session.email,
        created_at: session.created_at,
        expires_at: session.expires_at,
        token,
      });
    }

    if (req.method === "POST") {
      const body = (await readBody(req)) as { email?: string; password?: string };
      const email = String(body.email || "").toLowerCase().trim();
      const password = String(body.password || "");

      if (!email || !password) {
        return sendJson(res, 400, { error: "Email and password are required" });
      }

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
    }

    if (req.method === "DELETE") {
      return sendJson(res, 200, { ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth request failed";
    return sendJson(res, 500, { error: message });
  }
}
