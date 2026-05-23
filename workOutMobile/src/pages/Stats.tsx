import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { BarChart3, Filter, TrendingUp } from "lucide-react";
import PageHeader from "../components/PageHeader.tsx";
import Empty from "../components/Empty.tsx";
import { useActivePlanStore } from "../states/useActivePlanStore.ts";
import { listAllDays } from "../db/repos/days.ts";
import { listAllExercises } from "../db/repos/exercises.ts";
import { istDateString } from "../lib/time.ts";
import type { ExerciseRow, WorkoutDay } from "../models";

type Range = "7d" | "30d" | "90d" | "all";

export default function Stats() {
  const { plan } = useActivePlanStore();
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [range, setRange] = useState<Range>("30d");
  const [exerciseFilter, setExerciseFilter] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [d, e] = await Promise.all([listAllDays(), listAllExercises()]);
      setDays(plan ? d.filter((x) => x.plan_id === plan.id) : d);
      setExercises(e);
    })();
  }, [plan]);

  const exerciseNames = useMemo(
    () => Array.from(new Set(exercises.map((e) => e.name))).sort(),
    [exercises],
  );

  const sinceDate = useMemo(() => {
    if (range === "all") return new Date(0);
    const d = new Date();
    d.setDate(d.getDate() - (range === "7d" ? 7 : range === "30d" ? 30 : 90));
    return d;
  }, [range]);

  const volumeByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const ex of exercises) {
      if (exerciseFilter && ex.name !== exerciseFilter) continue;
      const day = days.find((d) => d.id === ex.workout_day_id);
      if (!day) continue;
      const date = new Date(day.created_at);
      if (date < sinceDate) continue;
      const key = istDateString(date);
      const vol = (ex.is_body_weighted ? 0 : ex.weight) * ex.number_of_reps;
      m.set(key, (m.get(key) ?? 0) + vol);
    }
    return [...m.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, volume]) => ({ date: date.slice(5), volume }));
  }, [exercises, days, exerciseFilter, sinceDate]);

  const maxByDay = useMemo(() => {
    if (!exerciseFilter) return [];
    const m = new Map<string, number>();
    for (const ex of exercises) {
      if (ex.name !== exerciseFilter) continue;
      const day = days.find((d) => d.id === ex.workout_day_id);
      if (!day) continue;
      const date = new Date(day.created_at);
      if (date < sinceDate) continue;
      const key = istDateString(date);
      const w = ex.is_body_weighted ? 0 : ex.weight;
      m.set(key, Math.max(m.get(key) ?? 0, w));
    }
    return [...m.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, max]) => ({ date: date.slice(5), max }));
  }, [exercises, days, exerciseFilter, sinceDate]);

  const totalVolume = volumeByDay.reduce((a, b) => a + b.volume, 0);
  const sessions = new Set(volumeByDay.map((d) => d.date)).size;

  // PRs: top 5 max weight per exercise across range
  const prList = useMemo(() => {
    const byEx = new Map<string, number>();
    for (const ex of exercises) {
      if (ex.is_body_weighted) continue;
      const day = days.find((d) => d.id === ex.workout_day_id);
      if (!day) continue;
      const date = new Date(day.created_at);
      if (date < sinceDate) continue;
      byEx.set(ex.name, Math.max(byEx.get(ex.name) ?? 0, ex.weight));
    }
    return Array.from(byEx.entries()).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [exercises, days, sinceDate]);

  return (
    <div className="page-in">
      <PageHeader title="Stats" subtitle={plan?.name ?? "All plans"} />
      <div className="px-5 space-y-4 stagger">
        {/* Range chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(["7d", "30d", "90d", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`press text-[12px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all ${
                range === r ? "text-primary-foreground" : "bg-card-2 text-foreground"
              }`}
              style={range === r ? { background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)", boxShadow: "var(--shadow-glow)" } : undefined}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Hero numbers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="surface-hero p-4">
            <p className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold relative z-10">Total volume</p>
            <p className="font-display text-display text-[30px] leading-none tabular-nums mt-1.5 relative z-10">
              {Math.round(totalVolume).toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 relative z-10">kg · reps</p>
          </div>
          <div className="surface p-4">
            <p className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">Sessions</p>
            <p className="font-display text-display text-[30px] leading-none tabular-nums mt-1.5">{sessions}</p>
            <p className="text-[11px] text-muted-foreground mt-1">in {range}</p>
          </div>
        </div>

        {/* Filter row */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={exerciseFilter ?? ""}
            onChange={(e) => setExerciseFilter(e.target.value || null)}
            className="appearance-none w-full bg-muted rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
          >
            <option value="">All exercises</option>
            {exerciseNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {volumeByDay.length === 0 ? (
          <Empty icon={BarChart3} title="No data yet" description="Log some sets to see your charts." />
        ) : (
          <div className="surface p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-display font-bold text-sm">Volume over time</p>
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> {exerciseFilter ?? "All"}
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeByDay} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-2)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border-2)",
                      borderRadius: 14,
                      fontSize: 12,
                      boxShadow: "var(--shadow-lg)",
                    }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="var(--primary)" strokeWidth={2.5} fill="url(#volGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {exerciseFilter && maxByDay.length > 0 && (
          <div className="surface p-4">
            <p className="font-display font-bold text-sm mb-2">Max weight — {exerciseFilter}</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maxByDay} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-2)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border-2)",
                      borderRadius: 14,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="max" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* PR leaderboard */}
        {prList.length > 0 && (
          <div className="surface p-4">
            <p className="font-display font-bold text-sm mb-3 inline-flex items-center gap-1.5">
              🏆 <span>Top weights</span>
            </p>
            <ul className="space-y-2">
              {prList.map(([name, kg], i) => (
                <li key={name} className="flex items-center gap-3 bg-card-2 rounded-xl px-3 py-2.5">
                  <span
                    className="h-7 w-7 grid place-items-center rounded-full font-display font-bold text-[12px] tabular-nums text-primary"
                    style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="font-medium text-sm flex-1 truncate">{name}</span>
                  <span className="font-display font-extrabold tabular-nums text-sm">{kg}<span className="text-[10px] text-muted-foreground ml-0.5">kg</span></span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
