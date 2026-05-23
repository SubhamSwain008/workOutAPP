import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, ArrowRight, WifiOff, ShieldCheck, Wifi } from "lucide-react";
import { uuid } from "../lib/uuid.ts";
import { claimUsername } from "../lib/api.ts";
import { persistUser } from "../auth/AuthProvider.tsx";
import { useUserStore } from "../states/useUserStore.ts";
import { useActivePlanStore } from "../states/useActivePlanStore.ts";
import { useSyncStore } from "../states/useSyncStore.ts";
import { setMeta } from "../db/schema.ts";
import { rekeyLocalRows, runSync } from "../lib/sync.ts";

const VALID = /^[a-zA-Z0-9_.-]{2,32}$/;

export default function Welcome() {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);
  const refreshPlan = useActivePlanStore((s) => s.refresh);
  const online = useSyncStore((s) => s.online);
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineNote, setOfflineNote] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOfflineNote(null);
    const u = username.trim().toLowerCase();
    if (!VALID.test(u)) {
      setError("2-32 chars: letters, digits, _ . - only");
      return;
    }
    setBusy(true);
    const offlineUserId = uuid();
    try {
      if (online) {
        const res = await claimUsername(u, offlineUserId);
        await persistUser({ userId: res.user_id, username: res.username });
        if (res.user_id !== offlineUserId) {
          await rekeyLocalRows(offlineUserId, res.user_id);
        }
        setUser({ userId: res.user_id, username: res.username });
        if (!res.is_new) {
          try { await runSync(res.user_id, { fullPull: true }); } catch { /* swallow */ }
        }
      } else {
        await persistUser({ userId: offlineUserId, username: u });
        await setMeta("pending_claim", "1");
        setUser({ userId: offlineUserId, username: u });
        setOfflineNote("Started offline. We'll register this name with the cloud on your first sync.");
      }
      await refreshPlan();
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh w-full bg-background bg-noise text-foreground flex flex-col px-6 pt-safe pb-8 page-in">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <span className="inline-flex items-center gap-1.5 chip">
          {online ? <Wifi className="h-3 w-3 text-success" /> : <WifiOff className="h-3 w-3" />}
          {online ? "Online" : "Offline"}
        </span>
        <span className="inline-flex items-center gap-1 chip">
          <ShieldCheck className="h-3 w-3" /> No password
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        <div
          className="h-20 w-20 rounded-3xl grid place-items-center text-white mb-8 shadow-glow"
          style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)" }}
        >
          <Dumbbell className="h-10 w-10" />
        </div>
        <h1 className="font-display text-[34px] font-extrabold tracking-tight leading-none mb-2">
          Welcome to <span className="text-gradient">Workout</span>
        </h1>
        <p className="text-muted-foreground mb-10 max-w-sm text-[14px] leading-relaxed">
          Pick a username to start logging workouts.<br />
          Works fully offline — sync when you want.
        </p>

        <form onSubmit={submit} className="w-full">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
            <input
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-username"
              className="w-full text-center text-lg font-display font-bold tracking-tight bg-card border border-border-2 rounded-2xl px-5 py-4 pl-9 outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
            />
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          {offlineNote && <p className="mt-3 text-xs text-muted-foreground">{offlineNote}</p>}

          <button
            type="submit"
            disabled={busy || username.trim().length < 2}
            className="btn-primary press mt-6 w-full py-4 inline-flex items-center justify-center gap-2 text-[15px]"
          >
            {busy ? (
              <span className="h-5 w-5 rounded-full border-2 border-white/70 border-t-transparent spin" />
            ) : (
              <>Continue <ArrowRight className="h-5 w-5" /></>
            )}
          </button>

          <p className="mt-4 text-[11px] text-muted-foreground">
            No email, no password, no tracking — just a name.
          </p>
        </form>
      </div>
    </div>
  );
}
