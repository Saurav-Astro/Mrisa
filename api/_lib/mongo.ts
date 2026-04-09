import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export const getMongoDb = async (): Promise<Db | null> => {
  const uri = process.env.MONGO_URI;
  if (!uri) return null;

  if (!clientPromise) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    clientPromise = client.connect();
  }

  try {
    const connectedClient = await clientPromise;
    const dbName = uri.includes("/") ? new URL(uri).pathname.replace("/", "") : process.env.MONGO_DB_NAME;
    return connectedClient.db(dbName || "mrisa");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    clientPromise = null;
    return null;
  }
};
