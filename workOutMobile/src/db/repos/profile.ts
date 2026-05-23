import { first, run } from "../sqlite.ts";
import type { Profile } from "../../models";
import { nowIso } from "../../lib/time.ts";

type Row = {
  user_id: string;
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  gender: string | null;
  current_goal: string | null;
  updated_at: string;
  dirty: number;
};

const parse = (r: Row): Profile => ({
  user_id: r.user_id,
  name: r.name,
  age: r.age,
  height: r.height === null ? null : Number(r.height),
  weight: r.weight === null ? null : Number(r.weight),
  gender: r.gender,
  current_goal: r.current_goal,
  updated_at: r.updated_at,
});

export async function getProfile(userId: string): Promise<Profile | null> {
  const row = await first<Row>(`select * from profile where user_id = ?`, [userId]);
  return row ? parse(row) : null;
}

export async function upsertProfile(userId: string, patch: Partial<Omit<Profile, "user_id" | "updated_at">>): Promise<Profile> {
  const now = nowIso();
  const existing = await getProfile(userId);
  const merged = { ...(existing ?? {}), ...patch };
  await run(
    `insert into profile (user_id, name, age, height, weight, gender, current_goal, updated_at, dirty)
     values (?, ?, ?, ?, ?, ?, ?, ?, 1)
     on conflict(user_id) do update set
       name = excluded.name,
       age = excluded.age,
       height = excluded.height,
       weight = excluded.weight,
       gender = excluded.gender,
       current_goal = excluded.current_goal,
       updated_at = excluded.updated_at,
       dirty = 1`,
    [
      userId,
      merged.name ?? null,
      merged.age ?? null,
      merged.height ?? null,
      merged.weight ?? null,
      merged.gender ?? null,
      merged.current_goal ?? null,
      now,
    ],
  );
  return (await getProfile(userId))!;
}
