import crypto from "node:crypto";

const SECRET = process.env.AUTH_SECRET || "mrisa-secret";
const ITERATIONS = 10000; // Simplified for speed

export const signToken = (payload: any): string => {
  const data = JSON.stringify({ ...payload, exp: Date.now() + 12 * 60 * 60 * 1000 });
  const encoded = Buffer.from(data).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(encoded).digest("hex");
  return `${encoded}.${signature}`;
};

export const verifyToken = (token?: string): any | null => {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(encoded).digest("hex");
  if (signature !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
};

export const hashPassword = (pw: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = crypto.pbkdf2Sync(pw, salt, ITERATIONS, 32, "sha256").toString("hex");
  return `pbkdf2$${salt}$${key}`;
};

export const verifyPassword = (pw: string, hash: string) => {
  if (!hash.startsWith("pbkdf2$")) return pw === hash; // basic plain fallback
  const [, salt, key] = hash.split("$");
  const check = crypto.pbkdf2Sync(pw, salt, ITERATIONS, 32, "sha256").toString("hex");
  return check === key;
};
