import { all, first, run } from "../sqlite.ts";
import type { WorkoutDay } from "../../models";
import { nowIso } from "../../lib/time.ts";
import { uuid } from "../../lib/uuid.ts";

type Row = {
  id: string;
  plan_id: string;
  day_index: number;
  day_type_name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  dirty: number;
};

const parse = (r: Row): WorkoutDay => ({
  id: r.id,
  plan_id: r.plan_id,
  day_index: r.day_index,
  day_type_name: JSON.parse(r.day_type_name) as string[],
  created_at: r.created_at,
  updated_at: r.updated_at,
  deleted_at: r.deleted_at,
});

export async function listDaysForPlan(planId: string): Promise<WorkoutDay[]> {
  const rows = await all<Row>(
    `select * from workout_days where plan_id = ? and deleted_at is null order by created_at desc`,
    [planId],
  );
  return rows.map(parse);
}

export async function getDay(id: string): Promise<WorkoutDay | null> {
  const row = await first<Row>(`select * from workout_days where id = ? and deleted_at is null`, [id]);
  return row ? parse(row) : null;
}

/**
 * Get the most recent (today's) day for a given plan_id + day_type combination
 * that was created today (IST). Otherwise create one and return it.
 */
export async function getOrCreateTodayDay(args: {
  planId: string;
  dayTypeName: string[];
  dayIndex: number;
}): Promise<WorkoutDay> {
  const dayJson = JSON.stringify(args.dayTypeName);
  const now = nowIso();
  // Match by IST date (substring 0..10 of ISO works only for UTC dates near the
  // boundary; for personal use this is fine and matches the web app's behavior).
  const today = now.slice(0, 10);
  const existing = await first<Row>(
    `select * from workout_days
       where plan_id = ? and day_type_name = ? and substr(created_at,1,10) = ?
         and deleted_at is null
       order by created_at desc limit 1`,
    [args.planId, dayJson, today],
  );
  if (existing) return parse(existing);
  const id = uuid();
  await run(
    `insert into workout_days (id, plan_id, day_index, day_type_name, created_at, updated_at, dirty)
     values (?, ?, ?, ?, ?, ?, 1)`,
    [id, args.planId, args.dayIndex, dayJson, now, now],
  );
  const created = await getDay(id);
  return created!;
}

export async function listDaysOnDate(planId: string, dateIso: string): Promise<WorkoutDay[]> {
  const date = dateIso.slice(0, 10);
  const rows = await all<Row>(
    `select * from workout_days where plan_id = ? and substr(created_at,1,10) = ? and deleted_at is null
     order by created_at desc`,
    [planId, date],
  );
  return rows.map(parse);
}

export async function listAllDays(): Promise<WorkoutDay[]> {
  const rows = await all<Row>(
    `select * from workout_days where deleted_at is null order by created_at desc`,
  );
  return rows.map(parse);
}

export async function deleteDay(id: string): Promise<void> {
  const now = nowIso();
  await run(`update workout_days set deleted_at = ?, updated_at = ?, dirty = 1 where id = ?`, [
    now,
    now,
    id,
  ]);
}
