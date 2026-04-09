const fs = require('fs');

const registrationsFile = 'api/registrations.ts';
let code = fs.readFileSync(registrationsFile, 'utf8');

code = code.replace(
  import { getMongoDb } from "./_lib/mongo.js";,
  import { getMongoDb } from "./_lib/mongo.js";\nimport { getBearerToken, verifyAdminToken } from "./_lib/auth.js";\nimport { ObjectId } from "mongodb";
);

code = code.replace(
  const readBody = async (req: IncomingMessage & { body?: unknown }) => {,
  const requireAdmin = (req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }) => {\n  const token = getBearerToken(req.headers.authorization as string | undefined);\n  const session = verifyAdminToken(token);\n  return Boolean(session);\n};\n\nconst readBody = async (req: IncomingMessage & { body?: unknown }) => {
);

const newHandler = export default async function handler(req: IncomingMessage & { body?: unknown; query?: Record<string, string | string[]>; headers: Record<string, string | string[] | undefined> }, res: ServerResponse) {
  try {
    const db = await getMongoDb();
    const collection = db.collection("registrations");

    if (req.method === "GET") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
      const eventId = req.query?.event_id;
      const query = eventId ? { event_id: String(eventId) } : {};
      const regs = await collection.find(query).sort({ created_at: -1 }).toArray();
      return sendJson(res, 200, regs.map(r => ({ ...r, id: String(r._id) })));
    }

    if (req.method === "DELETE") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
      const id = String(req.query?.id || "");
      if (!id) return sendJson(res, 400, { error: "Missing registration id" });
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) return sendJson(res, 404, { error: "Registration not found" });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const body = (await readBody(req)) as Record<string, unknown>;
    const eventId = String(body.event_id || "").trim();
    
    if (!eventId) {
      return sendJson(res, 400, { error: "Missing event_id" });
    }

    const payload = {
      ...body,
      event_id: eventId,
      created_at: new Date().toISOString(),
    };

    await collection.insertOne(payload);
    return sendJson(res, 201, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration request failed";
    return sendJson(res, 500, { error: message });
  }
};

code = code.replace(/export default async function handler[\s\S]+$/, newHandler);
fs.writeFileSync(registrationsFile, code);
console.log('Updated api/registrations.ts');


const eventsFile = 'api/events.ts';
let codeEvents = fs.readFileSync(eventsFile, 'utf8');

codeEvents = codeEvents.replace(
    created_at: string;\n  updated_at: string;\n},
    created_at: string;
  updated_at: string;
  registration_type?: "paid" | "unpaid";
  payment_qr_url?: string | null;
  payment_instructions?: string | null;
  participation_type?: "solo" | "team";
  team_min_members?: number | null;
  team_max_members?: number | null;
  team_enforce_details?: boolean | null;
  form_fields?: Array<{
    id: string;
    label: string;
    type: string;
    enabled: boolean;
    required: boolean;
  }> | null;
}
);

codeEvents = codeEvents.replace(
    created_at: event.created_at,\n  updated_at: event.updated_at,\n});,
    created_at: event.created_at,
  updated_at: event.updated_at,
  registration_type: event.registration_type || "unpaid",
  payment_qr_url: event.payment_qr_url ?? null,
  payment_instructions: event.payment_instructions ?? null,
  participation_type: event.participation_type || "solo",
  team_min_members: event.team_min_members ?? null,
  team_max_members: event.team_max_members ?? null,
  team_enforce_details: event.team_enforce_details ?? false,
  form_fields: event.form_fields ?? [],
});
);

codeEvents = codeEvents.replace(
          image_url: body.image_url ? String(body.image_url).trim() : null,\n        registration_link: body.registration_link ? String(body.registration_link).trim() : null,\n        created_at: now,\n        updated_at: now,\n      };,
          image_url: body.image_url ? String(body.image_url).trim() : null,
        registration_link: body.registration_link ? String(body.registration_link).trim() : null,
        created_at: now,
        updated_at: now,
        registration_type: body.registration_type === "paid" ? "paid" : "unpaid",
        payment_qr_url: body.payment_qr_url ? String(body.payment_qr_url).trim() : null,
        payment_instructions: body.payment_instructions ? String(body.payment_instructions).trim() : null,
        participation_type: body.participation_type === "team" ? "team" : "solo",
        team_min_members: Number.isFinite(Number(body.team_min_members)) ? Number(body.team_min_members) : null,
        team_max_members: Number.isFinite(Number(body.team_max_members)) ? Number(body.team_max_members) : null,
        team_enforce_details: Boolean(body.team_enforce_details),
        form_fields: Array.isArray(body.form_fields) ? body.form_fields : [],
      };
);

codeEvents = codeEvents.replace(
          image_url: body.image_url ? String(body.image_url).trim() : null,\n        registration_link: body.registration_link ? String(body.registration_link).trim() : null,\n        updated_at: new Date().toISOString(),\n      };,
          image_url: body.image_url ? String(body.image_url).trim() : null,
        registration_link: body.registration_link ? String(body.registration_link).trim() : null,
        updated_at: new Date().toISOString(),
        registration_type: body.registration_type === "paid" ? "paid" : "unpaid",
        payment_qr_url: body.payment_qr_url ? String(body.payment_qr_url).trim() : null,
        payment_instructions: body.payment_instructions ? String(body.payment_instructions).trim() : null,
        participation_type: body.participation_type === "team" ? "team" : "solo",
        team_min_members: Number.isFinite(Number(body.team_min_members)) ? Number(body.team_min_members) : null,
        team_max_members: Number.isFinite(Number(body.team_max_members)) ? Number(body.team_max_members) : null,
        team_enforce_details: Boolean(body.team_enforce_details),
        form_fields: Array.isArray(body.form_fields) ? body.form_fields : [],
      };
);

fs.writeFileSync(eventsFile, codeEvents);
console.log('Updated api/events.ts');
