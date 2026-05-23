import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, ArrowRight, WifiOff } from "lucide-react";
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
        // If server gave us a different id (username already existed), re-key local rows.
        if (res.user_id !== offlineUserId) {
          await rekeyLocalRows(offlineUserId, res.user_id);
        }
        setUser({ userId: res.user_id, username: res.username });
        // Pull cloud data on first claim if account already existed.
        if (!res.is_new) {
          try { await runSync(res.user_id, { fullPull: true }); } catch { /* swallow */ }
        }
      } else {
        // Offline: generate a UUID locally; we'll claim when first online.
        await persistUser({ userId: offlineUserId, username: u });
        await setMeta("pending_claim", "1");
        setUser({ userId: offlineUserId, username: u });
        setOfflineNote("Started offline. We'll register this name with the cloud on your first sync.");
      }
      await refreshPlan();
      navigate("/home", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 pt-12 pb-10 pt-safe page-in">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-auto">
        {!online && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted">
            <WifiOff className="h-3 w-3" /> Offline
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        <div className="h-20 w-20 rounded-3xl bg-primary text-primary-foreground grid place-items-center mb-8 shadow-lg">
          <Dumbbell className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Welcome</h1>
        <p className="text-muted-foreground mb-10 max-w-sm">
          Pick a username to start logging workouts. It's the only thing you need — no password, no email.
        </p>

        <form onSubmit={submit} className="w-full">
          <div className="relative">
            <input
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-username"
              className="w-full text-center text-lg font-semibold bg-card border border-border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/60"
            />
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          {offlineNote && <p className="mt-3 text-xs text-muted-foreground">{offlineNote}</p>}

          <button
            type="submit"
            disabled={busy || username.trim().length < 2}
            className="press mt-6 w-full bg-primary text-primary-foreground font-semibold rounded-2xl py-4 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? (
              <span className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent spin" />
            ) : (
              <>
                Continue <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <p className="mt-4 text-xs text-muted-foreground">
            Works fully offline. Cloud sync uses just your username.
          </p>
        </form>
      </div>
    </div>
  );
}
