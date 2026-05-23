import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check, CloudDownload, LogOut, Moon, Palette, RefreshCw, Smartphone, Sun, Wifi, WifiOff,
} from "lucide-react";
import PageHeader from "../components/PageHeader.tsx";
import Avatar from "../components/Avatar.tsx";
import Chip from "../components/Chip.tsx";
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
      <div className="px-5 space-y-5 stagger">
        {/* Account */}
        <button
          onClick={() => navigate("/profile")}
          className="press surface w-full p-4 flex items-center gap-3 text-left"
        >
          <Avatar name={username} size={48} />
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold truncate">@{username}</p>
            <p className="text-[11px] text-muted-foreground truncate font-mono">id {userId?.slice(0, 8)}…</p>
          </div>
          <Chip>Edit</Chip>
        </button>

        {/* Sync */}
        <Section title="Cloud sync">
          <div className="surface p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  online ? "text-success" : "text-muted-foreground"
                }`}
                style={online
                  ? { background: "color-mix(in srgb, var(--success) 14%, transparent)" }
                  : { background: "var(--muted)" }}
              >
                {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {online ? "Online" : "Offline"}
              </span>
              <span className="text-[11px] text-muted-foreground ml-auto">
                Last synced {relativeFromNow(lastSyncAt)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => userId && syncNow(userId)}
                disabled={!online || syncing}
                className="btn-primary press inline-flex items-center justify-center gap-1.5 py-2.5 text-sm"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "spin" : ""}`} />
                {syncing ? "Syncing…" : "Sync now"}
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
                className="btn-ghost press inline-flex items-center justify-center gap-1.5 py-2.5 text-sm"
              >
                <CloudDownload className={`h-4 w-4 ${restoring ? "spin" : ""}`} /> Restore
              </button>
            </div>

            {lastError && <p className="text-xs text-destructive">{lastError}</p>}

            <p className="text-[10.5px] text-muted-foreground font-mono break-all">
              {getBackendUrl()}
            </p>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <div className="surface p-4 space-y-4">
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-2">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "light", label: "Light", icon: Sun },
                  { v: "dark", label: "Dark", icon: Moon },
                  { v: "system", label: "Auto", icon: Smartphone },
                ] as const).map(({ v, label, icon: Icon }) => {
                  const active = mode === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setMode(v)}
                      className={`press inline-flex flex-col items-center gap-1.5 rounded-xl py-3 transition-all ${
                        active ? "text-primary-foreground" : "bg-card-2 text-foreground"
                      }`}
                      style={active ? { background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)" } : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11px] font-semibold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-2 inline-flex items-center gap-1">
                <Palette className="h-3 w-3" /> Accent color
              </p>
              <div className="grid grid-cols-8 gap-2">
                {ACCENTS.map((a) => {
                  const active = accent === a.name;
                  return (
                    <button
                      key={a.name}
                      onClick={() => setAccent(a.name)}
                      className="press relative aspect-square rounded-xl grid place-items-center transition-all"
                      style={{
                        background: a.preview,
                        boxShadow: active ? `0 0 0 3px var(--background), 0 0 0 5px ${a.preview}` : "var(--shadow-xs)",
                      }}
                      aria-label={a.label}
                    >
                      {active && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* Account actions */}
        <Section title="Account">
          <button
            onClick={async () => {
              if (!confirm(`Sign out @${username}? Local data stays on this device.`)) return;
              await clearLocalUser();
              setUser(null);
              navigate("/welcome", { replace: true });
            }}
            className="press w-full flex items-center gap-3 px-4 py-4 surface text-destructive font-semibold"
          >
            <LogOut className="h-4 w-4" /> Sign out (keep local data)
          </button>
        </Section>

        <p className="text-center text-[11px] text-muted-foreground py-2">
          Workout · offline-first
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[10.5px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
