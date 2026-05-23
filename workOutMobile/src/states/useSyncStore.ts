import { create } from "zustand";
import { Network } from "@capacitor/network";
import { getMeta } from "../db/schema.ts";
import { runSync, restoreFromCloud } from "../lib/sync.ts";

type State = {
  online: boolean;
  syncing: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  hydrate: () => Promise<void>;
  syncNow: (userId: string) => Promise<void>;
  restore: (userId: string) => Promise<void>;
  setOnline: (v: boolean) => void;
};

export const useSyncStore = create<State>((set, get) => ({
  online: true,
  syncing: false,
  lastSyncAt: null,
  lastError: null,

  setOnline: (v) => set({ online: v }),

  hydrate: async () => {
    const last = await getMeta("last_sync_at");
    set({ lastSyncAt: last });
    try {
      const status = await Network.getStatus();
      set({ online: status.connected });
    } catch {
      set({ online: typeof navigator !== "undefined" ? navigator.onLine : true });
    }
    try {
      await Network.addListener("networkStatusChange", (s) => set({ online: s.connected }));
    } catch {
      window.addEventListener("online", () => set({ online: true }));
      window.addEventListener("offline", () => set({ online: false }));
    }
  },

  syncNow: async (userId: string) => {
    if (get().syncing) return;
    set({ syncing: true, lastError: null });
    try {
      const res = await runSync(userId);
      set({ syncing: false, lastSyncAt: res.syncedAt });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ syncing: false, lastError: msg });
    }
  },

  restore: async (userId: string) => {
    if (get().syncing) return;
    set({ syncing: true, lastError: null });
    try {
      const res = await restoreFromCloud(userId);
      set({ syncing: false, lastSyncAt: res.syncedAt });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ syncing: false, lastError: msg });
    }
  },
}));
