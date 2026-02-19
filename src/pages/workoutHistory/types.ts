export type ExerciseRow = {
    id: string;
    name: string;
    set_number: number;
    number_of_reps: number;
    weight: number;
    is_body_weighted: boolean;
    targeted_muscles?: string | string[] | null;
};

export type WorkoutDay = {
    id: string;
    created_at: string;
    day_type_name: string | null;
    day_index?: number | null;
    exercise: ExerciseRow[];
};
