export type WorkoutDay = {
    id: string;
    plan_id: string;
    day_index: number;
    day_type_name: string[];
    created_at:string;

    setId: (id: string) => void;
    setPlanId: (plan_id: string) => void;
    setDayIndex: (day_index: number) => void;
    setDayTypeName: (day_type_name: string[]) => void;
    setCreatedDate:(created_at:string)=>void;

}