import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, BarChart3, Calendar, ChevronRight, Dumbbell, Flame, ListPlus,
  Plus, Repeat, Sparkles, Trash2, TrendingUp, WifiOff, RefreshCw, Zap,
} from "lucide-react";
import Sheet from "../components/Sheet.tsx";
import Empty from "../components/Empty.tsx";
import Avatar from "../components/Avatar.tsx";
import StatCard from "../components/StatCard.tsx";
import Sparkline from "../components/Sparkline.tsx";
import ProgressRing from "../components/ProgressRing.tsx";
import Chip from "../components/Chip.tsx";
import { useUserStore } from "../states/useUserStore.ts";
import { useActivePlanStore } from "../states/useActivePlanStore.ts";
import { useSyncStore } from "../states/useSyncStore.ts";
import { createPlan, deletePlan, listPlans, setActivePlan } from "../db/repos/plans.ts";
import { listAllDays, listDaysOnDate } from "../db/repos/days.ts";
import { listAllExercises, listExercisesForDay } from "../db/repos/exercises.ts";
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
  const [today, setToday] = useState<{ name: string; sets: number; vol: number; bw: boolean }[]>([]);
  const [streak, setStreak] = useState(0);
  const [weekVolumes, setWeekVolumes] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [weekSessions, setWeekSessions] = useState(0);
  const [weekVolumeTotal, setWeekVolumeTotal] = useState(0);
  const [recent, setRecent] = useState<{ id: string; date: string; type: string; sets: number; vol: number }[]>([]);
  const [sheet, setSheet] = useState<"new" | "switch" | null>(null);

  useEffect(() => {
    refresh();
    listPlans().then(setPlans);
  }, [refresh]);

  useEffect(() => {
    (async () => {
      const allDays = await listAllDays();
      const allEx = await listAllExercises();

      // Today's session
      if (plan) {
        const days = await listDaysOnDate(plan.id, new Date().toISOString());
        const acc: Record<string, { sets: number; vol: number; bw: boolean }> = {};
        for (const d of days) {
          const ex = await listExercisesForDay(d.id);
          for (const set of ex) {
            const k = set.name;
            const v = (set.is_body_weighted ? 0 : set.weight) * set.number_of_reps;
            acc[k] = {
              sets: (acc[k]?.sets ?? 0) + 1,
              vol: (acc[k]?.vol ?? 0) + v,
              bw: set.is_body_weighted || (acc[k]?.bw ?? false),
            };
          }
        }
        setToday(Object.entries(acc).map(([name, v]) => ({ name, ...v })));
      } else {
        setToday([]);
      }

      // Build week stats (last 7 days incl today)
      const todayKey = istDateString(new Date());
      const dayKeys: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dayKeys.push(istDateString(d));
      }
      const planDays = plan ? allDays.filter((d) => d.plan_id === plan.id) : allDays;
      const dayIdsByDate = new Map<string, string[]>();
      for (const d of planDays) {
        const k = istDateString(d.created_at);
        if (!dayIdsByDate.has(k)) dayIdsByDate.set(k, []);
        dayIdsByDate.get(k)!.push(d.id);
      }
      const vols = dayKeys.map((k) => {
        const ids = new Set(dayIdsByDate.get(k) ?? []);
        return allEx
          .filter((e) => ids.has(e.workout_day_id))
          .reduce((acc, e) => acc + (e.is_body_weighted ? 0 : e.weight) * e.number_of_reps, 0);
      });
      setWeekVolumes(vols);
      setWeekVolumeTotal(vols.reduce((a, b) => a + b, 0));
      setWeekSessions(dayKeys.filter((k) => (dayIdsByDate.get(k) ?? []).length > 0).length);

      // Streak — consecutive days back from today (inclusive) with at least one session
      let s = 0;
      for (let i = 0; ; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const k = istDateString(d);
        const hasSession = (dayIdsByDate.get(k) ?? []).length > 0;
        if (hasSession) s++;
        else if (i === 0) { /* today not yet logged is OK — continue check from yesterday */ }
        else break;
        if (i > 60) break; // safety
      }
      if (s === 0 && (dayIdsByDate.get(todayKey) ?? []).length === 0) {
        // also check yesterday for streak preservation
        const y = new Date(); y.setDate(y.getDate() - 1);
        if ((dayIdsByDate.get(istDateString(y)) ?? []).length > 0) {
          // count from yesterday
          let s2 = 0;
          for (let i = 1; ; i++) {
            const d = new Date(); d.setDate(d.getDate() - i);
            if ((dayIdsByDate.get(istDateString(d)) ?? []).length > 0) s2++;
            else break;
            if (i > 60) break;
          }
          s = s2;
        }
      }
      setStreak(s);

      // Recent sessions — last 4 distinct days
      const sorted = [...planDays].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      const recentArr: typeof recent = [];
      const seenDates = new Set<string>();
      for (const d of sorted) {
        const k = istDateString(d.created_at);
        if (seenDates.has(k)) continue;
        seenDates.add(k);
        const dayExs = allEx.filter((e) => e.workout_day_id === d.id);
        const v = dayExs.reduce((a, e) => a + (e.is_body_weighted ? 0 : e.weight) * e.number_of_reps, 0);
        recentArr.push({
          id: d.id,
          date: d.created_at,
          type: (d.day_type_name?.[0] ?? "workout").toString(),
          sets: dayExs.length,
          vol: v,
        });
        if (recentArr.length >= 4) break;
      }
      setRecent(recentArr);
    })();
  }, [plan]);

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }),
    [],
  );

  const totalSetsToday = today.reduce((a, b) => a + b.sets, 0);
  const totalVolToday = today.reduce((a, b) => a + b.vol, 0);

  return (
    <div className="page-in">
      {/* HERO GREETING */}
      <div className="px-5 pt-safe pt-6 pb-2 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">{todayLabel}</p>
          <div className="flex items-center gap-1.5">
            {streak > 0 && (
              <Chip variant="primary" className="!font-semibold">
                <Flame className="h-3 w-3" /> {streak}d
              </Chip>
            )}
            {!online ? (
              <Chip>
                <WifiOff className="h-3 w-3" />
              </Chip>
            ) : (
              <button
                onClick={() => userId && syncNow(userId)}
                disabled={syncing}
                className="press chip"
                title="Sync now"
              >
                <RefreshCw className={`h-3 w-3 ${syncing ? "spin" : ""}`} />
                {syncing ? "Syncing" : "Synced"}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={username} size={52} />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-[26px] font-extrabold leading-[1.1] tracking-tight">
              Hey, <span className="text-gradient break-all">{username}</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="px-5 mt-3 space-y-5 stagger">
        {/* ACTIVE PLAN HERO */}
        {plan ? (
          <div className="surface-hero p-5">
            <div className="relative z-10 flex items-start gap-4">
              <div>
                <span className="chip chip-primary mb-3">
                  <Zap className="h-3 w-3" /> Active plan
                </span>
                <h2 className="font-display text-[28px] leading-[1.05] font-extrabold tracking-tight">
                  {plan.name}
                </h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {plan.split_type.map((s) => (
                    <span key={s} className="chip">{s}</span>
                  ))}
                </div>
              </div>
              <ProgressRing
                value={weekSessions}
                max={plan.days_per_week}
                size={84}
                stroke={8}
                label={`${weekSessions}/${plan.days_per_week}`}
                sub="this week"
              />
            </div>

            <div className="relative z-10 mt-5 flex gap-2">
              <button
                onClick={() => navigate("/workout")}
                className="btn-primary press flex-1 inline-flex items-center justify-center gap-2 py-3.5 text-[15px]"
              >
                {totalSetsToday > 0 ? "Continue workout" : "Start workout"}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSheet("switch")}
                className="btn-ghost press inline-flex items-center justify-center gap-1.5 px-4 text-[13px]"
              >
                <Repeat className="h-3.5 w-3.5" /> Switch
              </button>
            </div>
          </div>
        ) : (
          <Empty
            icon={Sparkles}
            title="No active plan yet"
            description="Pick from 100+ science-backed splits — or design your own."
            action={
              <button
                onClick={() => setSheet("new")}
                className="btn-primary press inline-flex items-center gap-2 px-5 py-3"
              >
                <Plus className="h-4 w-4" /> Create plan
              </button>
            }
          />
        )}

        {/* WEEK STATS STRIP */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={TrendingUp}
            label="Volume"
            value={Math.round(weekVolumeTotal).toLocaleString()}
            unit="kg·reps"
            footer={<Sparkline data={weekVolumes} width={84} height={22} />}
          />
          <StatCard
            icon={Calendar}
            label="Sessions"
            value={weekSessions}
            unit="this wk"
            accent="success"
          />
          <StatCard
            icon={Flame}
            label="Streak"
            value={streak}
            unit="days"
            accent="warning"
          />
        </div>

        {/* TODAY'S SESSION */}
        {plan && (
          <div className="surface p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">Today</p>
                <h3 className="font-display text-lg font-bold mt-0.5">
                  {totalSetsToday === 0 ? "Not started" : `${totalSetsToday} sets logged`}
                </h3>
              </div>
              {totalSetsToday > 0 && (
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Volume</p>
                  <p className="font-display text-lg font-bold tabular-nums">
                    {Math.round(totalVolToday).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            {today.length === 0 ? (
              <button
                onClick={() => navigate("/workout")}
                className="btn-outline press w-full py-3 inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Log first set
              </button>
            ) : (
              <ul className="space-y-1.5">
                {today.slice(0, 4).map((t) => (
                  <li key={t.name} className="flex items-center justify-between bg-card-2 rounded-xl px-3 py-2.5">
                    <span className="font-medium text-sm truncate flex-1">{t.name}</span>
                    <span className="chip chip-primary text-[10.5px]">{t.sets} sets</span>
                  </li>
                ))}
                {today.length > 4 && (
                  <p className="text-center text-[11px] text-muted-foreground pt-1">
                    +{today.length - 4} more exercises
                  </p>
                )}
              </ul>
            )}
          </div>
        )}

        {/* RECENT SESSIONS */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-[11px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">Recent</h3>
              <button onClick={() => navigate("/history")} className="press text-[11px] text-primary font-semibold inline-flex items-center gap-0.5">
                See all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2">
              {recent.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate("/history")}
                  className="press surface w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <div
                    className="h-11 w-11 grid place-items-center rounded-xl font-display font-bold text-[11px] uppercase tracking-wider text-primary"
                    style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)" }}
                  >
                    {r.type.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold capitalize text-sm truncate">{r.type}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })} · {r.sets} sets
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold tabular-nums text-sm">{Math.round(r.vol).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">volume</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* QUICK CHIPS */}
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          <Chip variant="outline" onClick={() => setSheet("new")}>
            <ListPlus className="h-3 w-3" /> New plan
          </Chip>
          <Chip variant="outline" onClick={() => navigate("/analytics")}>
            <BarChart3 className="h-3 w-3" /> Stats
          </Chip>
          <Chip variant="outline" onClick={() => navigate("/profile")}>
            <Dumbbell className="h-3 w-3" /> Profile
          </Chip>
        </div>

        <p className="text-center text-[11px] text-muted-foreground pt-1">
          {online ? `Synced ${relativeFromNow(lastSyncAt)}` : "Offline — changes will sync later"}
        </p>
      </div>

      {/* SHEETS */}
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
  const [days, setDays] = useState(4);
  const [busy, setBusy] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = q
      ? WORKOUT_SPLITS.filter((s) => s.name.toLowerCase().includes(q))
      : WORKOUT_SPLITS;
    return arr.slice(0, 40);
  }, [query]);

  async function create() {
    if (!picked || busy) return;
    setBusy(true);
    try {
      const p = await createPlan({
        name: picked.name,
        split_type: picked.splitType,
        days_per_week: days,
        is_active: true,
      });
      onCreated(p);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-5 space-y-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search splits…"
        className="w-full bg-muted rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
      />

      <div className="grid grid-cols-2 gap-2 max-h-[44vh] overflow-y-auto thin-scrollbar pr-1">
        {results.map((s) => {
          const active = picked?.name === s.name;
          return (
            <button
              key={s.name}
              onClick={() => setPicked(s)}
              className={`press text-left rounded-xl px-3 py-3 border transition-all ${
                active ? "border-primary bg-primary/10" : "border-border-2 bg-card-2"
              }`}
            >
              <p className={`font-display font-bold text-sm leading-tight ${active ? "text-primary" : ""}`}>
                {s.name}
              </p>
              <p className="text-[10.5px] text-muted-foreground mt-1 truncate">
                {s.splitType.join(" · ")}
              </p>
            </button>
          );
        })}
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Days per week</label>
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => setDays(n)}
              className={`press py-3 rounded-xl font-display font-bold tabular-nums ${
                days === n ? "bg-primary text-primary-foreground shadow-glow" : "bg-card-2 text-foreground"
              }`}
              style={days === n ? { boxShadow: "var(--shadow-glow)" } : undefined}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={create}
        disabled={!picked || busy}
        className="btn-primary press w-full py-3.5"
      >
        {busy ? <span className="inline-block h-5 w-5 rounded-full border-2 border-white/70 border-t-transparent spin align-middle" /> : "Activate plan"}
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
    return <div className="p-6 text-center text-sm text-muted-foreground">No plans yet.</div>;
  }
  return (
    <ul className="p-3 space-y-2">
      {plans.map((p) => {
        const active = p.id === activeId;
        return (
          <li
            key={p.id}
            className={`rounded-2xl border p-3 flex items-center gap-3 ${
              active ? "border-primary bg-primary/10" : "border-border-2 bg-card-2"
            }`}
          >
            <button onClick={() => onActivate(p.id)} className="press flex-1 text-left min-w-0">
              <p className="font-display font-bold truncate">{p.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {p.split_type.join(" · ")} · {p.days_per_week}d/wk
              </p>
            </button>
            {active && <Chip variant="primary">ACTIVE</Chip>}
            <button
              onClick={() => { if (confirm(`Delete plan "${p.name}"?`)) onDelete(p.id); }}
              className="press h-9 w-9 grid place-items-center rounded-full bg-muted text-destructive"
              aria-label="Delete plan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
