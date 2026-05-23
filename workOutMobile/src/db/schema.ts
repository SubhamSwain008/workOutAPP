import { exec, first, run } from "./sqlite.ts";

const SCHEMA_VERSION = 1;

const CREATE_SQL = `
create table if not exists meta (
  key text primary key,
  value text
);

create table if not exists workout_plans (
  id text primary key,
  name text not null,
  split_type text not null,        -- JSON-encoded string[]
  days_per_week integer not null,
  is_active integer not null default 0,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  dirty integer not null default 1
);
create index if not exists idx_plans_dirty on workout_plans(dirty);

create table if not exists workout_days (
  id text primary key,
  plan_id text not null,
  day_index integer not null,
  day_type_name text not null,     -- JSON-encoded string[]
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  dirty integer not null default 1
);
create index if not exists idx_days_plan on workout_days(plan_id);
create index if not exists idx_days_dirty on workout_days(dirty);

create table if not exists exercises (
  id text primary key,
  workout_day_id text not null,
  name text not null,
  set_number integer not null,
  number_of_reps integer not null,
  weight real not null default 0,
  targated_muscles text not null default '[]', -- JSON-encoded string[]
  is_the_exercise_on integer not null default 0,
  is_the_exercise_done integer not null default 0,
  is_body_weighted integer not null default 0,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  dirty integer not null default 1
);
create index if not exists idx_ex_day on exercises(workout_day_id);
create index if not exists idx_ex_name on exercises(name);
create index if not exists idx_ex_dirty on exercises(dirty);

create table if not exists profile (
  user_id text primary key,
  name text,
  age integer,
  height real,
  weight real,
  gender text,
  current_goal text,
  updated_at text not null,
  dirty integer not null default 1
);
`;

export async function initSchema(): Promise<void> {
  await exec(CREATE_SQL);
  const row = await first<{ value: string }>(
    `select value from meta where key = 'schema_version'`,
  );
  if (!row) {
    await run(`insert into meta(key, value) values('schema_version', ?)`, [
      String(SCHEMA_VERSION),
    ]);
  } else if (Number(row.value) < SCHEMA_VERSION) {
    // Future migrations go here.
    await run(`update meta set value = ? where key = 'schema_version'`, [
      String(SCHEMA_VERSION),
    ]);
  }
}

// ──────────────────────────────────────────────────────────────────────
// Meta key/value helpers (user_id, username, last_pull_at, accent, etc.)
// ──────────────────────────────────────────────────────────────────────

export async function getMeta(key: string): Promise<string | null> {
  const row = await first<{ value: string }>(`select value from meta where key = ?`, [key]);
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string | null): Promise<void> {
  if (value === null) {
    await run(`delete from meta where key = ?`, [key]);
    return;
  }
  await run(
    `insert into meta(key, value) values(?, ?)
     on conflict(key) do update set value = excluded.value`,
    [key, value],
  );
}
