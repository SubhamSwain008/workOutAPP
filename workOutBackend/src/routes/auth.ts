import { Hono } from "hono";
import { z } from "zod";
import { query } from "../db.ts";

const usernameSchema = z
  .string()
  .min(2)
  .max(32)
  .regex(/^[a-zA-Z0-9_.-]+$/, "letters, digits, _ . - only");

export const auth = new Hono();

// Claim a username. Creates the user if it doesn't exist. If it does, returns
// the existing record (no password — personal use, by design).
// Claim a username. If a client_user_id is supplied AND the username is new,
// the server uses that id (so an offline-first device doesn't have to rewrite
// all its locally-created rows). If the username already exists, the server's
// existing user_id wins and the client must re-key its local rows.
auth.post("/claim", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = usernameSchema.safeParse(body.username);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "bad username" }, 400);
  }
  const username = parsed.data.toLowerCase();
  const clientId = typeof body.client_user_id === "string" ? body.client_user_id : null;

  let rows;
  if (clientId) {
    ({ rows } = await query<{ id: string; username: string; created_at: string; is_new: boolean }>(
      `with ins as (
         insert into users (id, username) values ($1, $2)
         on conflict (username) do nothing
         returning id, username, created_at, true as is_new
       )
       select * from ins
       union all
       select id, username, created_at, false as is_new
         from users where username = $2 and not exists (select 1 from ins)`,
      [clientId, username],
    ));
  } else {
    ({ rows } = await query<{ id: string; username: string; created_at: string; is_new: boolean }>(
      `with ins as (
         insert into users (username) values ($1)
         on conflict (username) do nothing
         returning id, username, created_at, true as is_new
       )
       select * from ins
       union all
       select id, username, created_at, false as is_new
         from users where username = $1 and not exists (select 1 from ins)`,
      [username],
    ));
  }
  const user = rows[0]!;
  return c.json({
    user_id: user.id,
    username: user.username,
    created_at: user.created_at,
    is_new: user.is_new,
  });
});

auth.get("/me", async (c) => {
  const userId = c.req.query("user_id");
  if (!userId) return c.json({ error: "user_id required" }, 400);
  const { rows } = await query<{ id: string; username: string }>(
    `select id, username from users where id = $1`,
    [userId],
  );
  if (rows.length === 0) return c.json({ error: "not found" }, 404);
  return c.json(rows[0]);
});
