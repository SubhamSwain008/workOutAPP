export type Activeplan = {
    id: string;
    name: string;
    split_type: string;
    days_per_week: number;
    is_active: boolean;

    setId: (id: string) => void;
    setName: (name: string) => void;
    setSplitType: (split_type: string) => void;
    setDaysPerWeek: (days_per_week: number) => void;
    setIsActive: (is_active: boolean) => void;
}