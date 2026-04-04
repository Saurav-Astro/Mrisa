import crypto from "node:crypto";
import { getMongoDb } from "./mongo.js";

export interface AdminTokenPayload {
  email: string;
  created_at: string;
  expires_at: string;
}

export interface AdminUserDocument {
  _id?: unknown;
  email: string;
  full_name?: string;
  role: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

const tokenSecret = process.env.AUTH_SECRET || process.env.MONGO_URI || "mrisa-dev-secret";
const sessionDurationMs = 12 * 60 * 60 * 1000;
const passwordIterations = 120000;
const passwordKeyLength = 32;
const passwordDigest = "sha256";

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const hashPassword = (password: string, salt = crypto.randomBytes(16).toString("hex")) => {
  const derivedKey = crypto.pbkdf2Sync(password, salt, passwordIterations, passwordKeyLength, passwordDigest).toString("hex");
  return `pbkdf2$${passwordDigest}$${passwordIterations}$${salt}$${derivedKey}`;
};

const sign = (payload: string) =>
  crypto.createHmac("sha256", tokenSecret).update(payload).digest("hex");

export const createAdminToken = (email: string): string => {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + sessionDurationMs);
  const payload: AdminTokenPayload = {
    email,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  };
  const rawPayload = JSON.stringify(payload);
  return `${encode(rawPayload)}.${sign(rawPayload)}`;
};

export const verifyAdminToken = (token: string | undefined | null): AdminTokenPayload | null => {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  try {
    const payload = decode(encodedPayload);
    if (sign(payload) !== signature) return null;

    const parsed = JSON.parse(payload) as AdminTokenPayload;
    if (Date.now() > new Date(parsed.expires_at).getTime()) return null;

    return parsed;
  } catch {
    return null;
  }
};

export const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

export const ensureAdminUsersSeeded = async () => {
  const db = await getMongoDb();
  const collection = db.collection<AdminUserDocument>("admin_users");

  await collection.createIndex({ email: 1 }, { unique: true });

  const existingCount = await collection.countDocuments();
  if (existingCount > 0) {
    return;
  }

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    return;
  }

  const now = new Date().toISOString();
  await collection.insertOne({
    email: email.toLowerCase().trim(),
    full_name: process.env.ADMIN_BOOTSTRAP_FULL_NAME || "Admin",
    role: "admin",
    password_hash: hashPassword(password),
    created_at: now,
    updated_at: now,
  });
};

export const findAdminUser = async (email: string) => {
  const db = await getMongoDb();
  const collection = db.collection<AdminUserDocument>("admin_users");
  return collection.findOne({ email: email.toLowerCase().trim() });
};

export const validateAdminPassword = (password: string, passwordHash: string) => {
  // Backward compatibility: some manual admin records were stored as plaintext.
  // Accept them during transition so login does not fail unexpectedly.
  if (!passwordHash.startsWith("pbkdf2$")) {
    return password === passwordHash;
  }

  const [scheme, digest, iterations, salt, storedKey] = passwordHash.split("$");
  if (scheme !== "pbkdf2" || !digest || !iterations || !salt || !storedKey) return false;

  const derivedKey = crypto.pbkdf2Sync(
    password,
    salt,
    Number(iterations),
    Buffer.from(storedKey, "hex").length,
    digest as typeof passwordDigest
  ).toString("hex");

  return crypto.timingSafeEqual(Buffer.from(derivedKey, "hex"), Buffer.from(storedKey, "hex"));
};
