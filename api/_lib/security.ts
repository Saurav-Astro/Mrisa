/**
 * api/_lib/security.ts
 * Centralised security utilities for every API handler.
 */

import type { IncomingMessage, ServerResponse } from "http";
import crypto from "node:crypto";

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore) {
    if (now > bucket.resetAt) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

const getClientIp = (req: IncomingMessage): string => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim()) ||
    (req.socket as any)?.remoteAddress ||
    "unknown";
  return ip;
};

const _sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

// ── Security Headers ──────────────────────────────────────────────────────────

export const applySecurityHeaders = (res: ServerResponse) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");
};

// ── Rate Limiter ──────────────────────────────────────────────────────────────

export const checkRateLimit = (
  req: IncomingMessage,
  res: ServerResponse,
  endpoint: string,
  opts: RateLimitOptions
): boolean => {
  const ip = getClientIp(req);
  const key = `${endpoint}:${ip}`;
  const now = Date.now();

  let bucket = rateLimitStore.get(key);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 1, resetAt: now + opts.windowMs };
    rateLimitStore.set(key, bucket);
    return true;
  }

  bucket.count += 1;
  const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);

  res.setHeader("X-RateLimit-Limit", String(opts.limit));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, opts.limit - bucket.count)));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > opts.limit) {
    res.setHeader("Retry-After", String(retryAfterSec));
    _sendJson(res, 429, {
      error: "Too many requests. Please slow down and try again later.",
      retryAfterSeconds: retryAfterSec,
    });
    return false;
  }

  return true;
};

// ── Body Size Limit ───────────────────────────────────────────────────────────

const DEFAULT_MAX_BODY_BYTES = 4 * 1024 * 1024; // 4 MB

export const readBodySecure = async (
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
  maxBytes = DEFAULT_MAX_BODY_BYTES
): Promise<Record<string, unknown> | null> => {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  if (typeof req.body === "string") {
    if (Buffer.byteLength(req.body) > maxBytes) {
      _sendJson(res, 413, { error: "Request body too large." });
      return null;
    }
    try { return JSON.parse(req.body || "{}"); }
    catch { _sendJson(res, 400, { error: "Invalid JSON body." }); return null; }
  }

  let raw = "";
  let totalBytes = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk as string);
    totalBytes += bytes;
    if (totalBytes > maxBytes) {
      _sendJson(res, 413, { error: "Request body too large." });
      return null;
    }
    raw += chunk;
  }

  try {
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    _sendJson(res, 400, { error: "Invalid JSON body." });
    return null;
  }
};

// ── Input Sanitizers ──────────────────────────────────────────────────────────

export const sanitizeString = (value: unknown, maxLength = 1000): string => {
  if (value === null || value === undefined) return "";
  return String(value)
    .trim()
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, "")   // strip HTML tags
    .replace(/\0/g, "")         // strip null bytes
    .trim();
};

export const sanitizeEmail = (value: unknown): string => {
  const raw = sanitizeString(value, 320).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : "";
};

export const isValidObjectId = (value: unknown): boolean =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

export const requestId = (): string => crypto.randomBytes(6).toString("hex");

// ── Safe internal error ───────────────────────────────────────────────────────

export const sendInternalError = (res: ServerResponse, err: unknown, context: string) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[${context}] internal error:`, msg);
  if (!res.headersSent) {
    _sendJson(res, 500, { error: "An internal server error occurred." });
  }
};
