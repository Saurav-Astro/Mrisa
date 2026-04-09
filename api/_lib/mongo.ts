import crypto from "node:crypto";
import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const getMongoClientPromise = () => {
  if (global.__mongoClientPromise) {
    return global.__mongoClientPromise;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGO_URI environment variable");
  }

  const mongoClient = new MongoClient(mongoUri, {
    maxPoolSize: 5,
    minPoolSize: 0,
    maxIdleTimeMS: 10000,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 30000,
  });

  global.__mongoClientPromise = mongoClient.connect();
  return global.__mongoClientPromise;
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

let initializationPromise: Promise<void> | null = null;

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
    db.collection("auth.audit_log_entries").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.audit_log_entries").createIndex({ created_at: -1 }),
    db.collection("auth.custom_oauth_providers").createIndex({ identifier: 1 }, { unique: true, sparse: true }),
    db.collection("auth.flow_state").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.flow_state").createIndex({ user_id: 1, created_at: -1 }),
    db.collection("auth.identities").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.identities").createIndex({ user_id: 1, provider_id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.instances").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.mfa_amr_claims").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.mfa_amr_claims").createIndex({ session_id: 1 }),
    db.collection("auth.mfa_challenges").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.mfa_challenges").createIndex({ factor_id: 1, created_at: -1 }),
    db.collection("auth.mfa_factors").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.mfa_factors").createIndex({ user_id: 1 }),
    db.collection("auth.oauth_authorizations").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.oauth_authorizations").createIndex({ authorization_id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.oauth_authorizations").createIndex({ authorization_code: 1 }, { unique: true, sparse: true }),
    db.collection("auth.oauth_authorizations").createIndex({ client_id: 1, user_id: 1 }),
    db.collection("auth.oauth_client_states").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.oauth_clients").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.oauth_consents").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.oauth_consents").createIndex({ user_id: 1, client_id: 1 }),
    db.collection("auth.one_time_tokens").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.one_time_tokens").createIndex({ user_id: 1, token_type: 1 }),
    db.collection("auth.refresh_tokens").createIndex({ token: 1 }, { unique: true, sparse: true }),
    db.collection("auth.refresh_tokens").createIndex({ session_id: 1 }),
    db.collection("auth.saml_providers").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.saml_providers").createIndex({ entity_id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.saml_relay_states").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.saml_relay_states").createIndex({ request_id: 1 }),
    db.collection("auth.schema_migrations").createIndex({ version: 1 }, { unique: true, sparse: true }),
    db.collection("auth.sessions").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.sessions").createIndex({ user_id: 1, updated_at: -1 }),
    db.collection("auth.sso_domains").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.sso_domains").createIndex({ sso_provider_id: 1, domain: 1 }, { unique: true, sparse: true }),
    db.collection("auth.sso_providers").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.users").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.users").createIndex({ email: 1 }, { unique: true, sparse: true }),
    db.collection("auth.users").createIndex({ phone: 1 }, { unique: true, sparse: true }),
    db.collection("auth.webauthn_challenges").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.webauthn_challenges").createIndex({ user_id: 1, expires_at: 1 }),
    db.collection("auth.webauthn_credentials").createIndex({ id: 1 }, { unique: true, sparse: true }),
    db.collection("auth.webauthn_credentials").createIndex({ user_id: 1 }),
    db.collection("auth.webauthn_credentials").createIndex({ credential_id: 1 }, { unique: true, sparse: true }),
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
};

const getMongoDbConnection = async () => {
  const client = await getMongoClientPromise();
  return client.db(getDatabaseName());
};

export const getMongoDb = async () => {
  if (!initializationPromise) {
    initializationPromise = ensureCollections().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  await initializationPromise;
  return getMongoDbConnection();
};
