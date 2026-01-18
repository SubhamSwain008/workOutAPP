import { create } from "zustand";
import type { Profile } from "../models/profile";

type UserState = {
  userId: string | null;
  profile: Profile | null;

  setUserId: (id: string | null) => void;
  setProfile: (profile: Profile | null) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  profile: null,

  setUserId: (id) => set({ userId: id }),
  setProfile: (profile) => set({ profile }),
  clearUser: () => set({ userId: null, profile: null }),
}));
