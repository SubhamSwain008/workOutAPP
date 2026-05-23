import { all, first, run, transaction } from "../sqlite.ts";
import type { ExerciseRow } from "../../models";
import { nowIso } from "../../lib/time.ts";
import { uuid } from "../../lib/uuid.ts";

type Row = {
  id: string;
  workout_day_id: string;
  name: string;
  set_number: number;
  number_of_reps: number;
  weight: number;
  targated_muscles: string;
  is_the_exercise_on: number;
  is_the_exercise_done: number;
  is_body_weighted: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  dirty: number;
};

const parse = (r: Row): ExerciseRow => ({
  id: r.id,
  workout_day_id: r.workout_day_id,
  name: r.name,
  set_number: r.set_number,
  number_of_reps: r.number_of_reps,
  weight: Number(r.weight),
  targated_muscles: JSON.parse(r.targated_muscles) as string[],
  is_the_exercise_on: !!r.is_the_exercise_on,
  is_the_exercise_done: !!r.is_the_exercise_done,
  is_body_weighted: !!r.is_body_weighted,
  created_at: r.created_at,
  updated_at: r.updated_at,
  deleted_at: r.deleted_at,
});

export async function listExercisesForDay(dayId: string): Promise<ExerciseRow[]> {
  const rows = await all<Row>(
    `select * from exercises where workout_day_id = ? and deleted_at is null
       order by name, set_number`,
    [dayId],
  );
  return rows.map(parse);
}

export async function listAllExercises(): Promise<ExerciseRow[]> {
  const rows = await all<Row>(
    `select * from exercises where deleted_at is null order by created_at`,
  );
  return rows.map(parse);
}

export async function addSet(args: {
  dayId: string;
  name: string;
  reps: number;
  weight: number;
  targatedMuscles: string[];
  isBodyWeighted: boolean;
}): Promise<ExerciseRow> {
  const now = nowIso();
  // next set_number for this name within this day
  const lastSet = await first<{ n: number | null }>(
    `select max(set_number) as n from exercises where workout_day_id = ? and name = ? and deleted_at is null`,
    [args.dayId, args.name],
  );
  const setNumber = (lastSet?.n ?? 0) + 1;
  const id = uuid();
  await run(
    `insert into exercises
      (id, workout_day_id, name, set_number, number_of_reps, weight,
       targated_muscles, is_the_exercise_on, is_the_exercise_done, is_body_weighted,
       created_at, updated_at, dirty)
     values (?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?, 1)`,
    [
      id,
      args.dayId,
      args.name,
      setNumber,
      args.reps,
      args.weight,
      JSON.stringify(args.targatedMuscles),
      args.isBodyWeighted ? 1 : 0,
      now,
      now,
    ],
  );
  const r = await first<Row>(`select * from exercises where id = ?`, [id]);
  return parse(r!);
}

export async function updateSet(id: string, patch: Partial<{
  reps: number;
  weight: number;
  is_body_weighted: boolean;
  is_the_exercise_done: boolean;
}>): Promise<void> {
  const now = nowIso();
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (patch.reps !== undefined) { sets.push("number_of_reps = ?"); vals.push(patch.reps); }
  if (patch.weight !== undefined) { sets.push("weight = ?"); vals.push(patch.weight); }
  if (patch.is_body_weighted !== undefined) { sets.push("is_body_weighted = ?"); vals.push(patch.is_body_weighted ? 1 : 0); }
  if (patch.is_the_exercise_done !== undefined) { sets.push("is_the_exercise_done = ?"); vals.push(patch.is_the_exercise_done ? 1 : 0); }
  if (sets.length === 0) return;
  sets.push("updated_at = ?", "dirty = 1");
  vals.push(now);
  vals.push(id);
  await run(`update exercises set ${sets.join(", ")} where id = ?`, vals);
}

export async function deleteSet(id: string): Promise<void> {
  const now = nowIso();
  // Soft delete this set, then renumber remaining sets for that exercise/day.
  const ex = await first<Row>(`select * from exercises where id = ?`, [id]);
  if (!ex) return;
  await transaction(async (tx) => {
    await tx.run(`update exercises set deleted_at = ?, updated_at = ?, dirty = 1 where id = ?`, [
      now,
      now,
      id,
    ]);
    const remaining = await all<Row>(
      `select * from exercises where workout_day_id = ? and name = ? and deleted_at is null order by set_number`,
      [ex.workout_day_id, ex.name],
    );
    for (let i = 0; i < remaining.length; i++) {
      const r = remaining[i]!;
      const want = i + 1;
      if (r.set_number !== want) {
        await tx.run(
          `update exercises set set_number = ?, updated_at = ?, dirty = 1 where id = ?`,
          [want, now, r.id],
        );
      }
    }
  });
}

export async function deleteExerciseGroup(dayId: string, name: string): Promise<void> {
  const now = nowIso();
  await run(
    `update exercises set deleted_at = ?, updated_at = ?, dirty = 1
       where workout_day_id = ? and name = ? and deleted_at is null`,
    [now, now, dayId, name],
  );
}

export async function suggestExerciseNames(query: string, limit = 8): Promise<string[]> {
  if (!query) return [];
  const rows = await all<{ name: string }>(
    `select distinct name from exercises where deleted_at is null and lower(name) like ?
       order by name limit ?`,
    [`%${query.toLowerCase()}%`, limit],
  );
  return rows.map((r) => r.name);
}
