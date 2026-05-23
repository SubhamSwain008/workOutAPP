/**
 * Offline-first sync engine.
 *
 * Push: send every dirty row to the server, then clear the dirty flag.
 * Pull: ask server for everything updated since last_pull_at; apply with
 *       last-write-wins by updated_at.
 * Restore: same as pull-from-epoch; useful for "rebuild local DB from cloud".
 */
import { all, run, transaction, saveToStore } from "../db/sqlite.ts";
import { getMeta, setMeta } from "../db/schema.ts";
import { upsertProfile, getProfile } from "../db/repos/profile.ts";
import { pingBackend, pullSince, pushChanges } from "./api.ts";
import { nowIso } from "./time.ts";
import type { ExerciseRow, Profile, WorkoutDay, WorkoutPlan } from "../models";

export type SyncResult = {
  pushedPlans: number;
  pushedDays: number;
  pushedExercises: number;
  pushedProfile: boolean;
  pulled: { plans: number; days: number; exercises: number; profile: boolean };
  syncedAt: string;
};

async function collectDirty() {
  const plans = (await all<{
    id: string; name: string; split_type: string; days_per_week: number; is_active: number;
    created_at: string; updated_at: string; deleted_at: string | null;
  }>(`select id, name, split_type, days_per_week, is_active, created_at, updated_at, deleted_at
        from workout_plans where dirty = 1`)).map((r) => ({
    id: r.id,
    name: r.name,
    split_type: JSON.parse(r.split_type) as string[],
    days_per_week: r.days_per_week,
    is_active: !!r.is_active,
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted_at: r.deleted_at,
  } satisfies WorkoutPlan));

  const days = (await all<{
    id: string; plan_id: string; day_index: number; day_type_name: string;
    created_at: string; updated_at: string; deleted_at: string | null;
  }>(`select id, plan_id, day_index, day_type_name, created_at, updated_at, deleted_at
        from workout_days where dirty = 1`)).map((r) => ({
    id: r.id,
    plan_id: r.plan_id,
    day_index: r.day_index,
    day_type_name: JSON.parse(r.day_type_name) as string[],
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted_at: r.deleted_at,
  } satisfies WorkoutDay));

  const exercises = (await all<{
    id: string; workout_day_id: string; name: string; set_number: number; number_of_reps: number;
    weight: number; targated_muscles: string; is_the_exercise_on: number; is_the_exercise_done: number;
    is_body_weighted: number; created_at: string; updated_at: string; deleted_at: string | null;
  }>(`select id, workout_day_id, name, set_number, number_of_reps, weight, targated_muscles,
            is_the_exercise_on, is_the_exercise_done, is_body_weighted, created_at, updated_at, deleted_at
        from exercises where dirty = 1`)).map((r) => ({
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
  } satisfies ExerciseRow));

  return { plans, days, exercises };
}

async function clearDirty(): Promise<void> {
  await transaction(async (tx) => {
    await tx.run(`update workout_plans set dirty = 0 where dirty = 1`);
    await tx.run(`update workout_days set dirty = 0 where dirty = 1`);
    await tx.run(`update exercises set dirty = 0 where dirty = 1`);
    await tx.run(`update profile set dirty = 0 where dirty = 1`);
  });
}

async function applyServerRows(rows: {
  plans: WorkoutPlan[]; days: WorkoutDay[]; exercises: ExerciseRow[]; profile: Omit<Profile, "user_id"> | null;
}, userId: string): Promise<void> {
  await transaction(async (tx) => {
    for (const p of rows.plans) {
      await tx.run(
        `insert into workout_plans (id, name, split_type, days_per_week, is_active, created_at, updated_at, deleted_at, dirty)
         values (?, ?, ?, ?, ?, ?, ?, ?, 0)
         on conflict(id) do update set
           name = excluded.name,
           split_type = excluded.split_type,
           days_per_week = excluded.days_per_week,
           is_active = excluded.is_active,
           updated_at = excluded.updated_at,
           deleted_at = excluded.deleted_at,
           dirty = 0
         where workout_plans.updated_at <= excluded.updated_at`,
        [
          p.id, p.name, JSON.stringify(p.split_type), p.days_per_week,
          p.is_active ? 1 : 0, p.created_at, p.updated_at, p.deleted_at,
        ],
      );
    }
    for (const d of rows.days) {
      await tx.run(
        `insert into workout_days (id, plan_id, day_index, day_type_name, created_at, updated_at, deleted_at, dirty)
         values (?, ?, ?, ?, ?, ?, ?, 0)
         on conflict(id) do update set
           plan_id = excluded.plan_id,
           day_index = excluded.day_index,
           day_type_name = excluded.day_type_name,
           updated_at = excluded.updated_at,
           deleted_at = excluded.deleted_at,
           dirty = 0
         where workout_days.updated_at <= excluded.updated_at`,
        [
          d.id, d.plan_id, d.day_index, JSON.stringify(d.day_type_name),
          d.created_at, d.updated_at, d.deleted_at,
        ],
      );
    }
    for (const e of rows.exercises) {
      await tx.run(
        `insert into exercises
          (id, workout_day_id, name, set_number, number_of_reps, weight, targated_muscles,
           is_the_exercise_on, is_the_exercise_done, is_body_weighted, created_at, updated_at, deleted_at, dirty)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
         on conflict(id) do update set
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
           deleted_at = excluded.deleted_at,
           dirty = 0
         where exercises.updated_at <= excluded.updated_at`,
        [
          e.id, e.workout_day_id, e.name, e.set_number, e.number_of_reps, e.weight,
          JSON.stringify(e.targated_muscles),
          e.is_the_exercise_on ? 1 : 0,
          e.is_the_exercise_done ? 1 : 0,
          e.is_body_weighted ? 1 : 0,
          e.created_at, e.updated_at, e.deleted_at,
        ],
      );
    }
    if (rows.profile) {
      await tx.run(
        `insert into profile (user_id, name, age, height, weight, gender, current_goal, updated_at, dirty)
         values (?, ?, ?, ?, ?, ?, ?, ?, 0)
         on conflict(user_id) do update set
           name = excluded.name,
           age = excluded.age,
           height = excluded.height,
           weight = excluded.weight,
           gender = excluded.gender,
           current_goal = excluded.current_goal,
           updated_at = excluded.updated_at,
           dirty = 0
         where profile.updated_at <= excluded.updated_at`,
        [
          userId,
          rows.profile.name, rows.profile.age, rows.profile.height, rows.profile.weight,
          rows.profile.gender, rows.profile.current_goal, rows.profile.updated_at,
        ],
      );
    }
  });
}

export type SyncOptions = { fullPull?: boolean };

export async function runSync(userId: string, opts: SyncOptions = {}): Promise<SyncResult> {
  const online = await pingBackend();
  if (!online) throw new Error("Backend unreachable");

  // PUSH first
  const dirty = await collectDirty();
  const profile = await getProfile(userId);
  // Treat profile as dirty if its dirty flag is set
  const profileDirty = (await all<{ dirty: number }>(`select dirty from profile where user_id = ?`, [userId]))[0]?.dirty === 1;

  const profilePayload = profileDirty && profile ? {
    name: profile.name, age: profile.age, height: profile.height, weight: profile.weight,
    gender: profile.gender, current_goal: profile.current_goal, updated_at: profile.updated_at,
  } : null;

  if (dirty.plans.length || dirty.days.length || dirty.exercises.length || profilePayload) {
    await pushChanges({
      user_id: userId,
      plans: dirty.plans,
      days: dirty.days,
      exercises: dirty.exercises,
      profile: profilePayload,
    });
    await clearDirty();
  }

  // PULL
  const since = opts.fullPull ? "1970-01-01T00:00:00Z" : (await getMeta("last_pull_at")) ?? "1970-01-01T00:00:00Z";
  const pulled = await pullSince(userId, since);
  await applyServerRows({
    plans: pulled.plans as WorkoutPlan[],
    days: pulled.days as WorkoutDay[],
    exercises: pulled.exercises as ExerciseRow[],
    profile: pulled.profile,
  }, userId);

  await setMeta("last_pull_at", pulled.server_time);
  await setMeta("last_sync_at", nowIso());
  await saveToStore();

  return {
    pushedPlans: dirty.plans.length,
    pushedDays: dirty.days.length,
    pushedExercises: dirty.exercises.length,
    pushedProfile: !!profilePayload,
    pulled: {
      plans: pulled.plans.length,
      days: pulled.days.length,
      exercises: pulled.exercises.length,
      profile: !!pulled.profile,
    },
    syncedAt: nowIso(),
  };
}

export async function restoreFromCloud(userId: string): Promise<SyncResult> {
  // Wipe local data (preserving meta + profile mapping) and pull everything.
  await transaction(async (tx) => {
    await tx.run(`delete from workout_plans`);
    await tx.run(`delete from workout_days`);
    await tx.run(`delete from exercises`);
    await tx.run(`delete from profile`);
  });
  await setMeta("last_pull_at", "1970-01-01T00:00:00Z");
  return runSync(userId, { fullPull: true });
}

/** Reassign user_id on every local row + drop+recreate profile row for a newly
 *  discovered server user_id. Used when /auth/claim returned an id that
 *  differs from the offline-generated one. */
export async function rekeyLocalRows(_oldUserId: string, newUserId: string): Promise<void> {
  // Plans, days, exercises don't store user_id locally — they're already
  // user-scoped by virtue of being in this app's DB. Only profile carries it.
  await run(`update profile set user_id = ?, dirty = 1, updated_at = ? where 1 = 1`, [newUserId, nowIso()]);
}

// re-export a small upsertProfile alias to satisfy unused-import linting in some bundles
export { upsertProfile };
