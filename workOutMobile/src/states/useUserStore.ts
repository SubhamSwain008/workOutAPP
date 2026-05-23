import { create } from "zustand";

type UserState = {
  userId: string | null;
  username: string | null;
  hydrated: boolean;
  setUser: (u: { userId: string; username: string } | null) => void;
  setHydrated: (v: boolean) => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  username: null,
  hydrated: false,
  setUser: (u) => set({ userId: u?.userId ?? null, username: u?.username ?? null }),
  setHydrated: (v) => set({ hydrated: v }),
}));
