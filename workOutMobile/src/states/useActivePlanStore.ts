import { create } from "zustand";
import type { WorkoutPlan } from "../models";
import { getActivePlan } from "../db/repos/plans.ts";

type State = {
  plan: WorkoutPlan | null;
  setPlan: (p: WorkoutPlan | null) => void;
  refresh: () => Promise<void>;
};

export const useActivePlanStore = create<State>((set) => ({
  plan: null,
  setPlan: (p) => set({ plan: p }),
  refresh: async () => set({ plan: await getActivePlan() }),
}));
