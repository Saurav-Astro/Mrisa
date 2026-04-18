import "dotenv/config";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.join(__dirname, "api");
const PORT = 3001;

const handlers: Record<string, (req: any, res: any) => any> = {};

const files = fs.readdirSync(apiDir).filter(
  (f: string) => (f.endsWith(".ts") || f.endsWith(".js")) && !f.startsWith("_")
);

for (const file of files) {
  const name = file.replace(/\.(ts|js)$/, "");
  const absolutePath = path.join(apiDir, file);
  const fileUrl = pathToFileURL(absolutePath).href;
  try {
    const mod = await import(fileUrl);
    if (mod.default) {
      handlers[`/api/${name}`] = mod.default;
      console.log(`Loaded route: /api/${name}`);
    } else {
      console.warn(`No default export in /api/${name}`);
    }
  } catch (err: any) {
    console.error(`Failed to load /api/${name}: ${err.message}`);
  }
}

const server = http.createServer(async (req: any, res: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const urlPath = (req.url || "/").split("?")[0];
  const handler = handlers[urlPath];
  res.setHeader("Content-Type", "application/json");

  if (handler) {
    try {
      await handler(req, res);
    } catch (err: any) {
      console.error(`Error in ${urlPath}:`, err.message);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: `Not found: ${urlPath}` }));
  }
});

server.listen(PORT, () => {
  console.log(`\n=== API Dev Server: http://localhost:${PORT} ===`);
  console.log("Routes:", Object.keys(handlers).join(", ") || "none");
});