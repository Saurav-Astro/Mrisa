# Mrisa

## MongoDB Setup

This project uses MongoDB for data and authentication.

Set these environment variables before running or deploying:

```bash
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
MONGO_DB_NAME=mrisa
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=change-me
ADMIN_BOOTSTRAP_FULL_NAME=Admin
AUTH_SECRET=generate-a-long-random-string
SEED_SECRET=generate-a-strong-one-time-seed-secret
```

Atlas credentials are not exposed by MongoDB automatically. Use Atlas to create a database user under Database Access, then copy the connection string from the Connect dialog. If you omit the database name in `MONGO_URI`, the app falls back to `MONGO_DB_NAME` or `mrisa`. The bootstrap admin values are only used to seed the first `admin_users` record when the database is empty.

## Post-Deploy Verification

Health check endpoint:

```bash
GET /api/health
```

One-time sample seed endpoint:

```bash
POST /api/seed
Header: x-seed-key: <SEED_SECRET>
```

The seed endpoint is locked to one execution by an `app_meta` marker document.