const fs = require('fs');
const eventsFile = 'api/events.ts';
let code = fs.readFileSync(eventsFile, 'utf8');
code = code.replace(
  "  created_at: string;\n  updated_at: string;\n}",
  `  created_at: string;
  updated_at: string;
  registration_type?: \"paid\" | \"unpaid\";
  payment_qr_url?: string | null;
  payment_instructions?: string | null;
  participation_type?: \"solo\" | \"team\";
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
}`
);

code = code.replace(
  "  created_at: event.created_at,\n  updated_at: event.updated_at,\n});",
  `  created_at: event.created_at,
  updated_at: event.updated_at,
  registration_type: event.registration_type || \"unpaid\",
  payment_qr_url: event.payment_qr_url ?? null,
  payment_instructions: event.payment_instructions ?? null,
  participation_type: event.participation_type || \"solo\",
  team_min_members: event.team_min_members ?? null,
  team_max_members: event.team_max_members ?? null,
  team_enforce_details: event.team_enforce_details ?? false,
  form_fields: event.form_fields ?? [],
});`
);

code = code.replace(
  "        image_url: body.image_url ? String(body.image_url).trim() : null,\n        registration_link: body.registration_link ? String(body.registration_link).trim() : null,\n        created_at: now,\n        updated_at: now,\n      };",
  `       image_url: body.image_url ? String(body.image_url).trim() : null,
        registration_link: body.registration_link ? String(body.registration_link).trim() : null,
        created_at: now,
        updated_at: now,
        registration_type: body.registration_type === \"paid\" ? \"paid\" : \"unpaid\",
        payment_qr_url: body.payment_qr_url ? String(body.payment_qr_url).trim() : null,
        payment_instructions: body.payment_instructions ? String(body.payment_instructions).trim() : null,
        participation_type: body.participation_type === \"team\" ? \"team\" ? \"solo\",
        team_min_members: Number.isFinite(Number(body.team_min_members)) ? Number(body.team_min_members) : null,
        team_max_members: Number.isFinite(Number(body.team_max_members)) ? Number(body.team_max_members) : null,
        team_enforce_details: Boolean(body.team_enforce_details),
        form_fields: Array.isArray(body.form_fields) ? body.form_fields : [],
      };`
);

code = code.replace(
  "        image_url: body.image_url ? String(body.image_url).trim() : null,\n        registration_link: body.registration_link ? String(body.registration_link).trim() : null,\n        updated_at: new Date().toISOString(),\n      };",
  `       image_url: body.image_url ? String(body.image_url).trim() : null,
        registration_link: body.registration_link ? String(body.registration_link).trim() : null,
        updated_at: new Date().toISOString(),
        registration_type: body.registration_type === \"paid\" ? \"paid\" : \"unpaid\",
        payment_qr_url: body.payment_qr_url ? String(body.payment_qr_url).trim() : null,
        participation_type: body.participation_type === \"team\" ? \"team\" ? \"solo\",
        team_min_members: Number.isFinite(Number(body.team_min_members)) ? Number(body.team_min_members) : null,
        team_max_members: Number.isFinite(Number(body.team_max_members)) ? Number(body.team_max_members) : null,
        team_enforce_details: Boolean(body.team_enforce_details),
        form_fields: Array.isArray(body.form_fields) ? body.form_fields : [],
      };`
);

fs.writeFileSync(eventsFile, code);
console.log('Updated api/events.ts');
