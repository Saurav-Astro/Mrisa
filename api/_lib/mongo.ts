import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

function extractDbName(uri: string): string {
  // mongodb+srv://user:pass@host/dbname?...
  const match = uri.match(/\.mongodb\.net\/([^?]+)/);
  return (match && match[1]) || process.env.MONGO_DB_NAME || "mrisa";
}

export const getMongoDb = async (): Promise<Db | null> => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set");
    return null;
  }
  if (!clientPromise) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    clientPromise = client.connect();
  }
  try {
    const connectedClient = await clientPromise;
    const dbName = extractDbName(uri);
    return connectedClient.db(dbName);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    clientPromise = null;
    return null;
  }
};
