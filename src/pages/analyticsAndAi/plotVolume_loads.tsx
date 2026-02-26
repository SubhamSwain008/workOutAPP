import { useMemo } from "react";
import { useVolumeLoadStore } from "./states/volume_load_store";
import { useMaxLoadStore } from "./states/maxweight";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function PlotVolumeLoads() {
  const { volumeLoadData, exerciseName, setExerciseName } =
    useVolumeLoadStore();
  const { maxWeightData } = useMaxLoadStore();

  const exerciseNames = useMemo(
    () => Array.from(new Set(volumeLoadData.map((d) => d.exerciseName))),
    [volumeLoadData]
  );

  const selectedExercise = exerciseName || exerciseNames[0] || "";

  const filteredData = useMemo(
    () =>
      volumeLoadData
        .filter((d) => d.exerciseName === selectedExercise)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [volumeLoadData, selectedExercise]
  );

  /* per-exercise aggregate for comparison bar chart */
  const exerciseComparison = useMemo(() => {
    const map: Record<string, number> = {};
    volumeLoadData.forEach((d) => {
      map[d.exerciseName] = (map[d.exerciseName] || 0) + d.volume_load;
    });
    return Object.entries(map)
      .map(([name, total]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [volumeLoadData]);

  const maxWeightEntry = useMemo(
    () => maxWeightData.find((d) => d.exerciseName === selectedExercise) ?? null,
    [maxWeightData, selectedExercise]
  );

  /* trend calculation */
  const trend = useMemo(() => {
    if (filteredData.length < 2) return null;
    const latest = filteredData[filteredData.length - 1].volume_load;
    const prev = filteredData[filteredData.length - 2].volume_load;
    if (prev === 0) return null;
    const pct = ((latest - prev) / prev) * 100;
    return { pct: Math.round(pct), up: pct >= 0 };
  }, [filteredData]);

  if (!exerciseNames.length) {
    return (
      <div className="flex flex-col items-center py-16 gap-2">
        <span className="text-3xl">📊</span>
        <p className="text-sm text-muted-foreground">No volume load data yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ---- HEADER + SELECTOR ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Volume Trend</h2>
          {trend && (
            <p className={`text-xs font-medium mt-0.5 ${trend.up ? "text-emerald-500" : "text-red-400"}`}>
              {trend.up ? "▲" : "▼"} {Math.abs(trend.pct)}% vs previous session
            </p>
          )}
        </div>
        <select
          value={selectedExercise}
          onChange={(e) => setExerciseName(e.target.value)}
          className="h-10 px-3 rounded-lg border border-foreground/8 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {exerciseNames.map((name) => (
            <option key={name} value={name} className="bg-background text-foreground">{name}</option>
          ))}
        </select>
      </div>

      {/* ---- AREA CHART ---- */}
      <div className="rounded-2xl border border-foreground/6 bg-foreground/2 p-4 overflow-hidden">
        <div className="w-full h-56 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary, #10b981)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-primary, #10b981)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border, #333)" strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground, #888)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground, #888)" }}
                tickLine={false}
                axisLine={false}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card, #1a1a1a)",
                  border: "1px solid var(--color-border, #333)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "var(--color-foreground, #fff)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Area
                type="monotone"
                dataKey="volume_load"
                name="Volume Load"
                stroke="var(--color-primary, #10b981)"
                strokeWidth={2.5}
                fill="url(#volGrad)"
                dot={{ r: 3, fill: "var(--color-primary, #10b981)", strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---- MAX WEIGHT CARD ---- */}
      {maxWeightEntry && (
        <div className="rounded-2xl border border-foreground/6 bg-foreground/2 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Personal Record — {selectedExercise}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-amber-500">
              {maxWeightEntry.max_weight}
            </span>
            <span className="text-sm text-muted-foreground">kg</span>
            <span className="ml-auto text-xs text-muted-foreground">
              on {maxWeightEntry.date}
            </span>
          </div>
        </div>
      )}

      {/* ---- EXERCISE COMPARISON BAR CHART ---- */}
      {exerciseComparison.length > 1 && (
        <div className="rounded-2xl border border-foreground/6 bg-foreground/2 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Exercise Comparison
            </span>
          </div>
          <div className="w-full h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exerciseComparison} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid stroke="var(--color-border, #333)" strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #888)" }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground, #888)" }}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card, #1a1a1a)",
                    border: "1px solid var(--color-border, #333)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--color-foreground, #fff)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  }}
                />
                <Bar
                  dataKey="total"
                  name="Total Volume"
                  fill="var(--color-primary, #8b5cf6)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
