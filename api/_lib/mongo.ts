import crypto from "node:crypto";
import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const getMongoClientPromise = async () => {
  if (global.__mongoClientPromise) {
    return global.__mongoClientPromise;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("[mongo] MONGO_URI is missing. Set it in Vercel environment variables.");
    return null;
  }

  try {
    const mongoClient = new MongoClient(mongoUri, {
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 30000,
    });

    global.__mongoClientPromise = mongoClient.connect();
    return global.__mongoClientPromise;
  } catch (err) {
    console.error("[mongo] Failed to create MongoClient:", err instanceof Error ? err.message : String(err));
    return null;
  }
};

const getDatabaseName = () => {
  const mongoUri = process.env.MONGO_URI || "";
  try {
    const uri = new URL(mongoUri);
    const databaseName = uri.pathname.replace(/^\//, "");
    return databaseName || process.env.MONGO_DB_NAME || "mrisa";
  } catch {
    return process.env.MONGO_DB_NAME || "mrisa";
  }
};

let initializationPromise: Promise<boolean> | null = null;

const hashPassword = (password: string, salt = crypto.randomBytes(16).toString("hex")) => {
  const iterations = 120000;
  const keyLength = 32;
  const digest = "sha256";
  const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("hex");
  return `pbkdf2$${digest}$${iterations}$${salt}$${derivedKey}`;
};

const getBootstrapAdminCredentials = () => {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return { email, password };
};

const appCollections = [
  "admin_users",
  "events",
  "winners",
  "registrations",
  "contact_messages",
];

const authCollections = [
  "auth.audit_log_entries",
  "auth.custom_oauth_providers",
  "auth.flow_state",
  "auth.identities",
  "auth.instances",
  "auth.mfa_amr_claims",
  "auth.mfa_challenges",
  "auth.mfa_factors",
  "auth.oauth_authorizations",
  "auth.oauth_client_states",
  "auth.oauth_clients",
  "auth.oauth_consents",
  "auth.one_time_tokens",
  "auth.refresh_tokens",
  "auth.saml_providers",
  "auth.saml_relay_states",
  "auth.schema_migrations",
  "auth.sessions",
  "auth.sso_domains",
  "auth.sso_providers",
  "auth.users",
  "auth.webauthn_challenges",
  "auth.webauthn_credentials",
];

const ensureCollections = async () => {
  const db = await getMongoDbConnection();
  if (!db) return false;

  try {
    const existingCollections = await db.listCollections().toArray();
    const collectionNames = new Set(existingCollections.map((collection) => collection.name));

    const ensureCollection = async (name: string) => {
      if (!collectionNames.has(name)) {
        await db.createCollection(name);
        collectionNames.add(name);
      }
    };

    await Promise.all([...appCollections, ...authCollections].map((name) => ensureCollection(name)));

    await Promise.all([
      db.collection("admin_users").createIndex({ email: 1 }, { unique: true }),
      db.collection("events").createIndex({ date: -1, status: 1 }),
      db.collection("events").createIndex({ status: 1, date: -1 }),
      db.collection("winners").createIndex({ event_id: 1, rank: 1 }),
      db.collection("winners").createIndex({ event_id: 1 }),
      db.collection("registrations").createIndex({ event_id: 1, created_at: -1 }),
      db.collection("contact_messages").createIndex({ created_at: -1 }),
    ]);

    const credentials = getBootstrapAdminCredentials();
    if (credentials) {
      const adminUsers = db.collection("admin_users");
      const now = new Date().toISOString();
      await adminUsers.updateOne(
        { email: credentials.email.toLowerCase().trim() },
        {
          $set: {
            full_name: process.env.ADMIN_BOOTSTRAP_FULL_NAME || "Admin",
            role: "admin",
            password_hash: hashPassword(credentials.password),
            updated_at: now,
          },
          $setOnInsert: {
            email: credentials.email.toLowerCase().trim(),
            created_at: now,
          },
        },
        { upsert: true }
      );
    }
    return true;
  } catch (err) {
    console.warn("[mongo] Initialization (ensureCollections) warning:", err instanceof Error ? err.message : String(err));
    return false;
  }
};

const getMongoDbConnection = async () => {
  try {
    const client = await getMongoClientPromise();
    if (!client) return null;
    return client.db(getDatabaseName());
  } catch (err) {
    console.error("[mongo] Connection error:", err instanceof Error ? err.message : String(err));
    return null;
  }
};

export const getMongoDb = async () => {
  if (!initializationPromise) {
    initializationPromise = ensureCollections().catch((error) => {
      console.error("[mongo] Global initialization error caught:", error);
      initializationPromise = null;
      return false;
    });
  }

  await initializationPromise;
  return getMongoDbConnection();
};
