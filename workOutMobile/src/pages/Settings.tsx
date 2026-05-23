import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CloudDownload, Cloud, LogOut, Moon, Palette, RefreshCw, Smartphone, Sun, User, Wifi, WifiOff,
} from "lucide-react";
import PageHeader from "../components/PageHeader.tsx";
import { useUserStore } from "../states/useUserStore.ts";
import { ACCENTS, useThemeStore } from "../states/useThemeStore.ts";
import { useSyncStore } from "../states/useSyncStore.ts";
import { clearLocalUser } from "../auth/AuthProvider.tsx";
import { relativeFromNow } from "../lib/time.ts";
import { getBackendUrl } from "../lib/api.ts";

export default function Settings() {
  const navigate = useNavigate();
  const { username, userId, setUser } = useUserStore();
  const { mode, accent, setMode, setAccent } = useThemeStore();
  const { online, syncing, lastSyncAt, lastError, syncNow, restore } = useSyncStore();
  const [restoring, setRestoring] = useState(false);

  return (
    <div className="page-in">
      <PageHeader title="Settings" />
      <div className="px-5 space-y-5">
        {/* Account card */}
        <div className="card p-4 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground grid place-items-center">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">@{username}</p>
            <p className="text-[11px] text-muted-foreground truncate">id {userId?.slice(0, 8)}…</p>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="press text-xs font-medium px-3 py-1.5 rounded-full bg-muted"
          >
            Edit profile
          </button>
        </div>

        {/* Sync card */}
        <Section title="Cloud sync">
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                online ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
              }`}>
                {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {online ? "Online" : "Offline"}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                Last synced {relativeFromNow(lastSyncAt)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => userId && syncNow(userId)}
                disabled={!online || syncing}
                className="press inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "spin" : ""}`} /> Sync now
              </button>
              <button
                onClick={async () => {
                  if (!userId) return;
                  if (!confirm("Replace local data with cloud copy? Local-only edits since last sync will be lost.")) return;
                  setRestoring(true);
                  await restore(userId);
                  setRestoring(false);
                }}
                disabled={!online || syncing || restoring}
                className="press inline-flex items-center justify-center gap-2 bg-muted rounded-xl py-3 font-medium disabled:opacity-50"
              >
                <CloudDownload className={`h-4 w-4 ${restoring ? "spin" : ""}`} /> Restore
              </button>
            </div>

            {lastError && (
              <p className="text-xs text-destructive">{lastError}</p>
            )}

            <p className="text-[11px] text-muted-foreground">
              Backend: <span className="font-mono">{getBackendUrl()}</span>
            </p>
          </div>
        </Section>

        {/* Theme */}
        <Section title="Appearance">
          <div className="card p-4 space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "light", label: "Light", icon: Sun },
                  { v: "dark", label: "Dark", icon: Moon },
                  { v: "system", label: "Auto", icon: Smartphone },
                ] as const).map(({ v, label, icon: Icon }) => (
                  <button
                    key={v}
                    onClick={() => setMode(v)}
                    className={`press inline-flex flex-col items-center gap-1 rounded-xl py-3 ${
                      mode === v ? "bg-primary/12 text-primary border border-primary/30" : "bg-muted text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1">
                <Palette className="h-3 w-3" /> Accent color
              </p>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.name}
                    onClick={() => setAccent(a.name)}
                    className={`press h-9 w-9 rounded-full grid place-items-center border-2 ${
                      accent === a.name ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ background: a.preview }}
                    aria-label={a.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* About / Danger */}
        <Section title="Account">
          <div className="card divide-y divide-border">
            <button
              onClick={async () => {
                if (!confirm(`Sign out @${username}? Local data stays on this device.`)) return;
                await clearLocalUser();
                setUser(null);
                navigate("/welcome", { replace: true });
              }}
              className="press w-full flex items-center gap-3 px-4 py-3.5 text-destructive font-medium"
            >
              <LogOut className="h-4 w-4" /> Sign out (keep local data)
            </button>
          </div>
        </Section>

        <p className="text-center text-[11px] text-muted-foreground">
          <Cloud className="inline h-3 w-3 mr-1" />
          Workout · offline-first
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
