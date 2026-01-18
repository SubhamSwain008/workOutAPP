
import type { Activeplan } from "../models/activeplan";

import { create } from "zustand";       
export const useActivePlanStore = create<Activeplan>((set) => ({
    id: "", 
    name: "",
    split_type: "",
    days_per_week: 0,
    is_active: true,

    setId: (id: string) => set({ id }),
    setName: (name: string) => set({ name }),
    setSplitType: (split_type: string) => set({ split_type }),
    setDaysPerWeek: (days_per_week: number) => set({ days_per_week }),
    setIsActive: (is_active: boolean) => set({ is_active }),

}));