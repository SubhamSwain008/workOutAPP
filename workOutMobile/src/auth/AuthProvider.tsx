import { useEffect, useState, type ReactNode } from "react";
import { initSchema, getMeta, setMeta } from "../db/schema.ts";
import { database } from "../db/sqlite.ts";
import { useUserStore } from "../states/useUserStore.ts";
import { useThemeStore } from "../states/useThemeStore.ts";
import { useSyncStore } from "../states/useSyncStore.ts";
import { useActivePlanStore } from "../states/useActivePlanStore.ts";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const setUser = useUserStore((s) => s.setUser);
  const setHydrated = useUserStore((s) => s.setHydrated);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateSync = useSyncStore((s) => s.hydrate);
  const refreshPlan = useActivePlanStore((s) => s.refresh);

  useEffect(() => {
    (async () => {
      try {
        await database();
        await initSchema();
        await hydrateTheme();
        await hydrateSync();
        const userId = await getMeta("user_id");
        const username = await getMeta("username");
        if (userId && username) {
          setUser({ userId, username });
          await refreshPlan();
        }
        setHydrated(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-dvh grid place-items-center p-6 text-center">
        <div>
          <h2 className="text-lg font-semibold text-destructive mb-2">Couldn't start the app</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export async function persistUser(u: { userId: string; username: string }) {
  await setMeta("user_id", u.userId);
  await setMeta("username", u.username);
}

export async function clearLocalUser() {
  await setMeta("user_id", null);
  await setMeta("username", null);
}
