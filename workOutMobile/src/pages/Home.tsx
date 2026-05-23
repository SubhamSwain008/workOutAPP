import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, Dumbbell, ListPlus, Plus, Sparkles, Trash2, WifiOff, RefreshCw,
} from "lucide-react";
import PageHeader from "../components/PageHeader.tsx";
import Empty from "../components/Empty.tsx";
import Sheet from "../components/Sheet.tsx";
import { useUserStore } from "../states/useUserStore.ts";
import { useActivePlanStore } from "../states/useActivePlanStore.ts";
import { useSyncStore } from "../states/useSyncStore.ts";
import { createPlan, deletePlan, listPlans, setActivePlan } from "../db/repos/plans.ts";
import { listDaysOnDate, listDaysForPlan } from "../db/repos/days.ts";
import { listExercisesForDay } from "../db/repos/exercises.ts";
import { WORKOUT_SPLITS } from "../lib/workoutSplits.ts";
import { istDateString, relativeFromNow } from "../lib/time.ts";
import type { WorkoutPlan } from "../models";

export default function Home() {
  const navigate = useNavigate();
  const username = useUserStore((s) => s.username);
  const userId = useUserStore((s) => s.userId);
  const { plan, refresh } = useActivePlanStore();
  const { online, syncing, lastSyncAt, syncNow } = useSyncStore();

  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [today, setToday] = useState<{ name: string; sets: number }[]>([]);
  const [sheet, setSheet] = useState<"new" | "switch" | null>(null);

  useEffect(() => {
    refresh();
    listPlans().then(setPlans);
  }, [refresh]);

  useEffect(() => {
    (async () => {
      if (!plan) {
        setToday([]);
        return;
      }
      const days = await listDaysOnDate(plan.id, new Date().toISOString());
      const acc: Record<string, number> = {};
      for (const d of days) {
        const ex = await listExercisesForDay(d.id);
        for (const set of ex) {
          acc[set.name] = (acc[set.name] ?? 0) + 1;
        }
      }
      setToday(Object.entries(acc).map(([name, sets]) => ({ name, sets })));
    })();
  }, [plan]);

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }),
    [],
  );

  return (
    <div className="page-in">
      <PageHeader
        title={`Hey ${username ?? ""}`}
        subtitle={todayLabel}
        right={
          <div className="flex items-center gap-2 text-xs">
            {!online ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                <WifiOff className="h-3 w-3" /> Offline
              </span>
            ) : (
              <button
                onClick={() => userId && syncNow(userId)}
                disabled={syncing}
                className="press inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-muted"
              >
                <RefreshCw className={`h-3 w-3 ${syncing ? "spin" : ""}`} /> Sync
              </button>
            )}
          </div>
        }
      />
      <div className="px-5 space-y-5">
        {/* Active plan card */}
        {plan ? (
          <div className="card p-5 slide-up">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Active plan</p>
                <h2 className="text-xl font-bold truncate mt-1">{plan.name}</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {plan.split_type.map((s) => (
                    <span key={s} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/12 text-primary">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">days/week</p>
                <p className="text-2xl font-bold">{plan.days_per_week}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => navigate("/workout")}
                className="press inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-3.5 font-semibold"
              >
                <Dumbbell className="h-4 w-4" /> Start workout
              </button>
              <button
                onClick={() => setSheet("switch")}
                className="press inline-flex items-center justify-center gap-2 bg-muted text-foreground rounded-2xl py-3.5 font-medium"
              >
                Switch plan
              </button>
            </div>
          </div>
        ) : (
          <Empty
            icon={Sparkles}
            title="No active plan"
            description="Create your first workout plan to get going."
            action={
              <button
                onClick={() => setSheet("new")}
                className="press inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 font-medium"
              >
                <Plus className="h-4 w-4" /> Create plan
              </button>
            }
          />
        )}

        {/* Today summary */}
        {plan && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Today's session</h3>
              <span className="text-xs text-muted-foreground">
                {today.length === 0 ? "Not started" : `${today.length} exercises`}
              </span>
            </div>
            {today.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tap <strong className="text-foreground">Start workout</strong> to log your first set.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {today.map((t) => (
                  <li key={t.name} className="flex items-center justify-between py-2.5">
                    <span className="font-medium truncate">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t.sets} sets</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSheet("new")}
            className="press card p-4 text-left active:scale-[0.98]"
          >
            <ListPlus className="h-5 w-5 text-primary mb-2" />
            <p className="font-semibold">New plan</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pick from 100+ splits</p>
          </button>
          <button
            onClick={() => navigate("/history")}
            className="press card p-4 text-left"
          >
            <Dumbbell className="h-5 w-5 text-primary mb-2" />
            <p className="font-semibold">History</p>
            <p className="text-xs text-muted-foreground mt-0.5">Browse past workouts</p>
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground pt-2">
          {online ? `Last synced ${relativeFromNow(lastSyncAt)}` : "Offline — changes will sync later"}
        </p>
      </div>

      {/* Sheets */}
      <Sheet open={sheet === "new"} onClose={() => setSheet(null)} title="New workout plan">
        <NewPlanForm
          onCreated={async (p) => {
            setSheet(null);
            await refresh();
            setPlans(await listPlans());
            if (p.is_active) navigate("/workout");
          }}
        />
      </Sheet>
      <Sheet open={sheet === "switch"} onClose={() => setSheet(null)} title="Your plans">
        <PlanList
          plans={plans}
          activeId={plan?.id ?? null}
          onActivate={async (id) => {
            await setActivePlan(id);
            await refresh();
            setPlans(await listPlans());
            setSheet(null);
          }}
          onDelete={async (id) => {
            await deletePlan(id);
            await refresh();
            setPlans(await listPlans());
          }}
        />
      </Sheet>
    </div>
  );
}

function NewPlanForm({ onCreated }: { onCreated: (p: WorkoutPlan) => void }) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<{ name: string; splitType: string[] } | null>(null);
  const [days, setDays] = useState(3);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = q
      ? WORKOUT_SPLITS.filter((s) => s.name.toLowerCase().includes(q))
      : WORKOUT_SPLITS;
    return arr.slice(0, 30);
  }, [query]);

  async function create() {
    if (!picked) return;
    const p = await createPlan({
      name: picked.name,
      split_type: picked.splitType,
      days_per_week: days,
      is_active: true,
    });
    onCreated(p);
  }

  return (
    <div className="p-5 space-y-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search splits…"
        className="w-full bg-muted rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
      />

      <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto thin-scrollbar">
        {results.map((s) => {
          const active = picked?.name === s.name;
          return (
            <button
              key={s.name}
              onClick={() => setPicked(s)}
              className={`press text-left rounded-xl px-3.5 py-3 border ${
                active ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              <p className={`font-semibold ${active ? "text-primary" : ""}`}>{s.name}</p>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">
                {s.splitType.join(" · ")}
              </p>
            </button>
          );
        })}
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Days per week</label>
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => setDays(n)}
              className={`press py-2.5 rounded-xl font-semibold ${
                days === n ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={create}
        disabled={!picked}
        className="press w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-semibold disabled:opacity-50"
      >
        Activate plan
      </button>
    </div>
  );
}

function PlanList({
  plans, activeId, onActivate, onDelete,
}: {
  plans: WorkoutPlan[];
  activeId: string | null;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (plans.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">No plans yet.</div>
    );
  }
  return (
    <ul className="p-3 space-y-2">
      {plans.map((p) => {
        const active = p.id === activeId;
        return (
          <li
            key={p.id}
            className={`rounded-2xl border p-3 flex items-center gap-3 ${
              active ? "border-primary bg-primary/10" : "border-border bg-card"
            }`}
          >
            <button onClick={() => onActivate(p.id)} className="press flex-1 text-left min-w-0">
              <p className="font-semibold truncate">{p.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {p.split_type.join(" · ")} · {p.days_per_week}d/wk · created {istDateString(p.created_at)}
              </p>
            </button>
            {active ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/12 text-primary">ACTIVE</span>
            ) : null}
            <button
              onClick={() => {
                if (confirm(`Delete plan "${p.name}"?`)) onDelete(p.id);
              }}
              className="press h-9 w-9 grid place-items-center rounded-full bg-muted text-destructive"
              aria-label="Delete plan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </li>
        );
      })}
    </ul>
  );
}
