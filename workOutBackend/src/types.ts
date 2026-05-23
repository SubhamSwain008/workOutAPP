import { z } from "zod";

export const uuid = z.string().uuid();
export const iso = z.string().datetime({ offset: true });

export const planRow = z.object({
  id: uuid,
  name: z.string(),
  split_type: z.array(z.string()),
  days_per_week: z.number().int(),
  is_active: z.boolean(),
  created_at: iso,
  updated_at: iso,
  deleted_at: iso.nullable(),
});

export const dayRow = z.object({
  id: uuid,
  plan_id: uuid,
  day_index: z.number().int(),
  day_type_name: z.array(z.string()),
  created_at: iso,
  updated_at: iso,
  deleted_at: iso.nullable(),
});

export const exerciseRow = z.object({
  id: uuid,
  workout_day_id: uuid,
  name: z.string(),
  set_number: z.number().int(),
  number_of_reps: z.number().int(),
  weight: z.number(),
  targated_muscles: z.array(z.string()),
  is_the_exercise_on: z.boolean(),
  is_the_exercise_done: z.boolean(),
  is_body_weighted: z.boolean(),
  created_at: iso,
  updated_at: iso,
  deleted_at: iso.nullable(),
});

export const profileRow = z.object({
  name: z.string().nullable(),
  age: z.number().int().nullable(),
  height: z.number().nullable(),
  weight: z.number().nullable(),
  gender: z.string().nullable(),
  current_goal: z.string().nullable(),
  updated_at: iso,
});

export const pushBody = z.object({
  user_id: uuid,
  plans: z.array(planRow).default([]),
  days: z.array(dayRow).default([]),
  exercises: z.array(exerciseRow).default([]),
  profile: profileRow.nullable().optional(),
});

export type PlanRow = z.infer<typeof planRow>;
export type DayRow = z.infer<typeof dayRow>;
export type ExerciseRow = z.infer<typeof exerciseRow>;
export type ProfileRow = z.infer<typeof profileRow>;
