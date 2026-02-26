import { create } from "zustand";

export const useCurretWorkoutStore= create<{ currentActiveWorkoutName: string | null; setCurrentActiveWorkoutName: (name: string | null) => void }>((set) => ({
    currentActiveWorkoutName: null,
    setCurrentActiveWorkoutName: (name: string | null) => set({ currentActiveWorkoutName: name }),
}));