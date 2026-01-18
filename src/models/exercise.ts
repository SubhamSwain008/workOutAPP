export type ExerciseRow = {
  id: string;
  name: string;
  set_number: number;
  number_of_reps: number;
  weight: number;
  created_at: string;
  targated_muscles: string[];
  is_the_exercise_on: boolean;
  is_the_exercise_done: boolean;
};