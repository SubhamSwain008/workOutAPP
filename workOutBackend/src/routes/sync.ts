import { Hono } from "hono";
import { pool, query } from "../db.ts";
import { pushBody } from "../types.ts";

export const sync = new Hono();

// PUSH: client uploads rows. Server applies last-write-wins by updated_at.
sync.post("/push", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = pushBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }
  const { user_id, plans, days, exercises, profile } = parsed.data;

  // Confirm user exists (cheap guard).
  const u = await query<{ id: string }>(`select id from users where id = $1`, [user_id]);
  if (u.rows.length === 0) return c.json({ error: "unknown user_id" }, 404);

  const client = await pool.connect();
  try {
    await client.query("begin");

    for (const p of plans) {
      await client.query(
        `insert into workout_plans
           (id, user_id, name, split_type, days_per_week, is_active, created_at, updated_at, deleted_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (id) do update set
           name = excluded.name,
           split_type = excluded.split_type,
           days_per_week = excluded.days_per_week,
           is_active = excluded.is_active,
           updated_at = excluded.updated_at,
           deleted_at = excluded.deleted_at
         where workout_plans.updated_at <= excluded.updated_at`,
        [
          p.id, user_id, p.name, p.split_type, p.days_per_week, p.is_active,
          p.created_at, p.updated_at, p.deleted_at,
        ],
      );
    }

    for (const d of days) {
      await client.query(
        `insert into workout_days
           (id, plan_id, user_id, day_index, day_type_name, created_at, updated_at, deleted_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (id) do update set
           plan_id = excluded.plan_id,
           day_index = excluded.day_index,
           day_type_name = excluded.day_type_name,
           updated_at = excluded.updated_at,
           deleted_at = excluded.deleted_at
         where workout_days.updated_at <= excluded.updated_at`,
        [
          d.id, d.plan_id, user_id, d.day_index, d.day_type_name,
          d.created_at, d.updated_at, d.deleted_at,
        ],
      );
    }

    for (const e of exercises) {
      await client.query(
        `insert into exercises
           (id, workout_day_id, user_id, name, set_number, number_of_reps, weight,
            targated_muscles, is_the_exercise_on, is_the_exercise_done, is_body_weighted,
            created_at, updated_at, deleted_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         on conflict (id) do update set
           workout_day_id = excluded.workout_day_id,
           name = excluded.name,
           set_number = excluded.set_number,
           number_of_reps = excluded.number_of_reps,
           weight = excluded.weight,
           targated_muscles = excluded.targated_muscles,
           is_the_exercise_on = excluded.is_the_exercise_on,
           is_the_exercise_done = excluded.is_the_exercise_done,
           is_body_weighted = excluded.is_body_weighted,
           updated_at = excluded.updated_at,
           deleted_at = excluded.deleted_at
         where exercises.updated_at <= excluded.updated_at`,
        [
          e.id, e.workout_day_id, user_id, e.name, e.set_number, e.number_of_reps, e.weight,
          e.targated_muscles, e.is_the_exercise_on, e.is_the_exercise_done, e.is_body_weighted,
          e.created_at, e.updated_at, e.deleted_at,
        ],
      );
    }

    if (profile) {
      await client.query(
        `insert into profiles
           (user_id, name, age, height, weight, gender, current_goal, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (user_id) do update set
           name = excluded.name,
           age = excluded.age,
           height = excluded.height,
           weight = excluded.weight,
           gender = excluded.gender,
           current_goal = excluded.current_goal,
           updated_at = excluded.updated_at
         where profiles.updated_at <= excluded.updated_at`,
        [
          user_id, profile.name, profile.age, profile.height, profile.weight,
          profile.gender, profile.current_goal, profile.updated_at,
        ],
      );
    }

    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    console.error("[sync/push] failed", err);
    return c.json({ error: "push failed" }, 500);
  } finally {
    client.release();
  }

  return c.json({ ok: true, server_time: new Date().toISOString() });
});

// PULL: server returns everything updated since `since` (ISO timestamp).
// Pass since=1970-01-01 to fetch everything.
sync.get("/pull", async (c) => {
  const userId = c.req.query("user_id");
  const since = c.req.query("since") ?? "1970-01-01T00:00:00Z";
  if (!userId) return c.json({ error: "user_id required" }, 400);

  const [plans, days, exercises, profile] = await Promise.all([
    query(
      `select id, name, split_type, days_per_week, is_active, created_at, updated_at, deleted_at
         from workout_plans where user_id = $1 and updated_at > $2 order by updated_at`,
      [userId, since],
    ),
    query(
      `select id, plan_id, day_index, day_type_name, created_at, updated_at, deleted_at
         from workout_days where user_id = $1 and updated_at > $2 order by updated_at`,
      [userId, since],
    ),
    query(
      `select id, workout_day_id, name, set_number, number_of_reps, weight,
              targated_muscles, is_the_exercise_on, is_the_exercise_done, is_body_weighted,
              created_at, updated_at, deleted_at
         from exercises where user_id = $1 and updated_at > $2 order by updated_at`,
      [userId, since],
    ),
    query(
      `select name, age, height, weight, gender, current_goal, updated_at
         from profiles where user_id = $1 and updated_at > $2`,
      [userId, since],
    ),
  ]);

  return c.json({
    server_time: new Date().toISOString(),
    plans: plans.rows,
    days: days.rows,
    exercises: exercises.rows,
    profile: profile.rows[0] ?? null,
  });
});
