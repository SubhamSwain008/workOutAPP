import { create } from "zustand";

export type MaxWeightEntry = {
  exerciseName: string;
  date: string;
  max_weight: number;
};

export const useMaxLoadStore = create<{
  maxWeightData: MaxWeightEntry[];
  setMaxWeightData: (data: MaxWeightEntry[]) => void;
}>((set) => ({
  maxWeightData: [],
  setMaxWeightData: (data) => set({ maxWeightData: data }),
}));