export type WorkoutPlan = {
  id: string;
  name: string;
  split_type: string[];
  days_per_week: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type WorkoutDay = {
  id: string;
  plan_id: string;
  day_index: number;
  day_type_name: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ExerciseRow = {
  id: string;
  workout_day_id: string;
  name: string;
  set_number: number;
  number_of_reps: number;
  weight: number;
  targated_muscles: string[];
  is_the_exercise_on: boolean;
  is_the_exercise_done: boolean;
  is_body_weighted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Profile = {
  user_id: string;
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  gender: string | null;
  current_goal: string | null;
  updated_at: string;
};
