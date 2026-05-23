import { all, first, run, transaction } from "../sqlite.ts";
import type { WorkoutPlan } from "../../models";
import { nowIso } from "../../lib/time.ts";
import { uuid } from "../../lib/uuid.ts";

type Row = {
  id: string;
  name: string;
  split_type: string;
  days_per_week: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  dirty: number;
};

const parse = (r: Row): WorkoutPlan => ({
  id: r.id,
  name: r.name,
  split_type: JSON.parse(r.split_type) as string[],
  days_per_week: r.days_per_week,
  is_active: !!r.is_active,
  created_at: r.created_at,
  updated_at: r.updated_at,
  deleted_at: r.deleted_at,
});

export async function listPlans(): Promise<WorkoutPlan[]> {
  const rows = await all<Row>(
    `select * from workout_plans where deleted_at is null order by is_active desc, updated_at desc`,
  );
  return rows.map(parse);
}

export async function getActivePlan(): Promise<WorkoutPlan | null> {
  const row = await first<Row>(
    `select * from workout_plans where deleted_at is null and is_active = 1 limit 1`,
  );
  return row ? parse(row) : null;
}

export async function getPlan(id: string): Promise<WorkoutPlan | null> {
  const row = await first<Row>(`select * from workout_plans where id = ? and deleted_at is null`, [id]);
  return row ? parse(row) : null;
}

export async function createPlan(input: {
  name: string;
  split_type: string[];
  days_per_week: number;
  is_active?: boolean;
}): Promise<WorkoutPlan> {
  const now = nowIso();
  const id = uuid();
  await transaction(async (tx) => {
    if (input.is_active) {
      await tx.run(`update workout_plans set is_active = 0, updated_at = ?, dirty = 1`, [now]);
    }
    await tx.run(
      `insert into workout_plans
        (id, name, split_type, days_per_week, is_active, created_at, updated_at, dirty)
       values (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        input.name,
        JSON.stringify(input.split_type),
        input.days_per_week,
        input.is_active ? 1 : 0,
        now,
        now,
      ],
    );
  });
  const plan = await getPlan(id);
  return plan!;
}

export async function setActivePlan(id: string): Promise<void> {
  const now = nowIso();
  await transaction(async (tx) => {
    await tx.run(`update workout_plans set is_active = 0, updated_at = ?, dirty = 1`, [now]);
    await tx.run(`update workout_plans set is_active = 1, updated_at = ?, dirty = 1 where id = ?`, [
      now,
      id,
    ]);
  });
}

export async function deletePlan(id: string): Promise<void> {
  const now = nowIso();
  await run(
    `update workout_plans set deleted_at = ?, is_active = 0, updated_at = ?, dirty = 1 where id = ?`,
    [now, now, id],
  );
  await run(`update workout_days set deleted_at = ?, updated_at = ?, dirty = 1 where plan_id = ? and deleted_at is null`, [now, now, id]);
  // Exercises cascade via day_id existing in code paths; in the simple model
  // we leave them alone since they reference workout_day_id which is also soft-deleted.
}

export async function renamePlan(id: string, name: string): Promise<void> {
  const now = nowIso();
  await run(`update workout_plans set name = ?, updated_at = ?, dirty = 1 where id = ?`, [name, now, id]);
}
