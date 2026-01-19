import { create } from "zustand";


export const useMaxLoadStore = create<{
  exerciseName: string;
  setExerciseName: (name: string) => void;
  maxWeightData: Array<{ date: string; max_weight: number }>;
  setMaxWeightData: (data: Array<{ date: string; max_weight: number }>) => void;
}>((set) => ({
  exerciseName: "",
  setExerciseName: (name) => set({ exerciseName: name }),
  maxWeightData: [],
  setMaxWeightData: (data) => set({ maxWeightData: data }),
}));