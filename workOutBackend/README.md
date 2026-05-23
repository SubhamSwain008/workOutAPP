# workOutBackend

Tiny Hono server that proxies the mobile app to Neon Postgres for sync.

```bash
npm install
npm run migrate           # applies src/schema.sql to Neon (one-time / idempotent)
npm run dev               # tsx watch on :3001
```

## Endpoints

| Method | Path         | Purpose                                                    |
| ------ | ------------ | ---------------------------------------------------------- |
| GET    | /health      | liveness probe                                             |
| POST   | /auth/claim  | claim/reuse a username; optionally supply client_user_id   |
| GET    | /auth/me     | look up a user by id                                       |
| POST   | /sync/push   | upload dirty rows; last-write-wins by `updated_at`         |
| GET    | /sync/pull   | server returns rows updated since `?since=...`             |

All ids are client-generated UUIDs. There are no passwords or tokens — for
personal use only. Don't expose this server to the public internet without
adding at least a shared secret.

## Deploy to Render (sketch)

```yaml
services:
  - type: web
    name: workout-backend
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        sync: false
```

Then set `VITE_BACKEND_URL` in `workOutMobile/.env` to the Render URL.
