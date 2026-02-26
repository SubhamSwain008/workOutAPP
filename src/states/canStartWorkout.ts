import { create } from "zustand";

export const useCanStartWorkoutStore = create<{ canStartWorkout: boolean; setCanStartWorkout: (canStart: boolean) => void }>((set) => ({
    canStartWorkout: false,
    setCanStartWorkout: (canStart: boolean) => set({ canStartWorkout: canStart }),
}));