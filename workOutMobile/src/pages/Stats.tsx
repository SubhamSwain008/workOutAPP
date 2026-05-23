import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader.tsx";
import Empty from "../components/Empty.tsx";
import { BarChart3 } from "lucide-react";
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

  return (
    <div className="page-in">
      <PageHeader title="Stats" subtitle={plan?.name ?? "All plans"} />
      <div className="px-5 space-y-4">
        {/* Range chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(["7d", "30d", "90d", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`press text-xs font-medium px-3 py-1.5 rounded-full ${
                range === r ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Exercise filter */}
        <select
          value={exerciseFilter ?? ""}
          onChange={(e) => setExerciseFilter(e.target.value || null)}
          className="w-full bg-muted rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
        >
          <option value="">All exercises</option>
          {exerciseNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total volume</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{Math.round(totalVolume).toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">kg · reps</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Sessions</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{sessions}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">in this range</p>
          </div>
        </div>

        {/* Volume chart */}
        {volumeByDay.length === 0 ? (
          <Empty icon={BarChart3} title="No data yet" description="Log some sets to see your charts." />
        ) : (
          <div className="card p-4">
            <p className="font-semibold mb-2 text-sm">Volume over time</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeByDay} margin={{ top: 6, right: 6, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="var(--primary)" fill="url(#vol)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Max chart (only if filter set) */}
        {exerciseFilter && maxByDay.length > 0 && (
          <div className="card p-4">
            <p className="font-semibold mb-2 text-sm">Max weight — {exerciseFilter}</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maxByDay} margin={{ top: 6, right: 6, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="max" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
