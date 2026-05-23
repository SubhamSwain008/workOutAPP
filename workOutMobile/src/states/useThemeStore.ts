import { create } from "zustand";
import { getMeta, setMeta } from "../db/schema.ts";

export type ThemeMode = "light" | "dark" | "system";
export type AccentName = "violet" | "teal" | "amber" | "rose" | "blue" | "emerald" | "indigo" | "orange";

export const ACCENTS: { name: AccentName; label: string; preview: string }[] = [
  { name: "violet",  label: "Violet",  preview: "#8c5cff" },
  { name: "indigo",  label: "Indigo",  preview: "#818cf8" },
  { name: "blue",    label: "Blue",    preview: "#60a5fa" },
  { name: "teal",    label: "Teal",    preview: "#2dd4bf" },
  { name: "emerald", label: "Emerald", preview: "#34d399" },
  { name: "amber",   label: "Amber",   preview: "#f59e0b" },
  { name: "orange",  label: "Orange",  preview: "#fb923c" },
  { name: "rose",    label: "Rose",    preview: "#fb7185" },
];

type State = {
  mode: ThemeMode;
  accent: AccentName;
  hydrated: boolean;
  setMode: (m: ThemeMode) => Promise<void>;
  setAccent: (a: AccentName) => Promise<void>;
  hydrate: () => Promise<void>;
};

function applyMode(mode: ThemeMode) {
  const root = document.documentElement;
  const resolved =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : mode;
  root.classList.toggle("dark", resolved === "dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#0e0f12" : "#f7f7fa");
}

function applyAccent(a: AccentName) {
  document.documentElement.setAttribute("data-accent", a);
}

let mqlListener: ((e: MediaQueryListEvent) => void) | null = null;
function bindSystemListener(mode: ThemeMode) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  if (mqlListener) mql.removeEventListener("change", mqlListener);
  if (mode !== "system") return;
  mqlListener = () => applyMode("system");
  mql.addEventListener("change", mqlListener);
}

export const useThemeStore = create<State>((set) => ({
  mode: "system",
  accent: "violet",
  hydrated: false,
  setMode: async (m) => {
    await setMeta("theme_mode", m);
    applyMode(m);
    bindSystemListener(m);
    set({ mode: m });
  },
  setAccent: async (a) => {
    await setMeta("accent", a);
    applyAccent(a);
    set({ accent: a });
  },
  hydrate: async () => {
    const mode = ((await getMeta("theme_mode")) as ThemeMode | null) ?? "system";
    const accent = ((await getMeta("accent")) as AccentName | null) ?? "violet";
    applyMode(mode);
    applyAccent(accent);
    bindSystemListener(mode);
    set({ mode, accent, hydrated: true });
  },
}));
