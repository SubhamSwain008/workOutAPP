import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./routes/auth.ts";
import { sync } from "./routes/sync.ts";

const app = new Hono();
app.use("*", logger());
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"] }));

app.get("/", (c) => c.json({ ok: true, name: "workout-backend" }));
app.get("/health", (c) => c.json({ ok: true, t: new Date().toISOString() }));

app.route("/auth", auth);
app.route("/sync", sync);

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[workout-backend] listening on http://localhost:${info.port}`);
});
