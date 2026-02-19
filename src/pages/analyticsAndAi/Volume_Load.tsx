import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useUserStore } from "../../states/useAuthStore";
import { useMaxLoadStore } from "./states/maxweight";
import { useVolumeLoadStore } from "./states/volume_load_store";
import { MiniChart } from "../../components/MiniChart";

/* ---------- types ---------- */

type ExerciseVolumeLoad = {
  date: string;
  exerciseName: string;
  volumeLoad: number;
  totalSets: number;
};

type DayWorkouts = {
  date: string;
  exercises: ExerciseVolumeLoad[];
};

/* ---------- helpers ---------- */

function getISTDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

function getTodayIST() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ---------- stat card ---------- */

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-foreground/6 bg-foreground/2 p-4 transition-all hover:bg-foreground/4 hover:border-foreground/10">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent || "text-foreground"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ---------- volume bar ---------- */

function VolumeBar({
  name,
  volume,
  sets,
  max,
}: {
  name: string;
  volume: number;
  sets: number;
  max: number;
}) {
  const pct = max > 0 ? (volume / max) * 100 : 0;
  return (
    <div className="group flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs font-medium text-foreground" title={name}>
        {name}
      </span>
      <div className="relative flex-1 h-5 rounded-full bg-foreground/6 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-emerald-500/80 to-emerald-400/60 transition-all duration-700 ease-out"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-semibold tabular-nums text-foreground/70">
          {volume.toLocaleString()}
        </span>
      </div>
      <span className="w-14 text-right text-[10px] text-muted-foreground shrink-0">
        {sets} sets
      </span>
    </div>
  );
}

/* ---------- component ---------- */

export default function Volume_LoadAnalytics() {
  const userID = useUserStore((s) => s.userId);

  const [dayWorkouts, setDayWorkouts] = useState<DayWorkouts[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userID) return;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: plans } = await supabase
          .from("workout_plan")
          .select("id")
          .eq("user_id", userID);

        if (!plans?.length) { setDayWorkouts([]); return; }

        const planIds = plans.map((p) => p.id);

        const { data: workoutDays } = await supabase
          .from("workout_day")
          .select("id, created_at")
          .in("plan_id", planIds);

        if (!workoutDays?.length) { setDayWorkouts([]); return; }

        const dayMap: Record<string, string> = {};
        workoutDays.forEach((d) => { dayMap[d.id] = getISTDate(d.created_at); });

        const dayIds = workoutDays.map((d) => d.id);

        const { data: exercises } = await supabase
          .from("exercise")
          .select("name, weight, number_of_reps, workout_day_id")
          .in("workout_day_id", dayIds)
          .eq("is_the_exercise_done", true);

        if (!exercises?.length) { setDayWorkouts([]); return; }

        /* aggregate */
        const grouped: Record<string, { volumeLoad: number; sets: number }> = {};
        exercises.forEach((s) => {
          const date = dayMap[s.workout_day_id];
          if (!date) return;
          const key = `${date}|${s.name}`;
          const load = s.number_of_reps * s.weight;
          if (!grouped[key]) grouped[key] = { volumeLoad: 0, sets: 0 };
          grouped[key].volumeLoad += load;
          grouped[key].sets += 1;
        });

        const flat: ExerciseVolumeLoad[] = Object.entries(grouped).map(([key, v]) => {
          const [date, exerciseName] = key.split("|");
          return { date, exerciseName, volumeLoad: v.volumeLoad, totalSets: v.sets };
        });

        const byDate: Record<string, ExerciseVolumeLoad[]> = {};
        flat.forEach((e) => { (byDate[e.date] ??= []).push(e); });

        const result: DayWorkouts[] = Object.entries(byDate)
          .map(([date, exercises]) => ({
            date,
            exercises: exercises.sort((a, b) => b.volumeLoad - a.volumeLoad),
          }))
          .sort((a, b) => b.date.localeCompare(a.date));

        setDayWorkouts(result);

        /* stores */
        const maxWeightMap: Record<string, { date: string; max: number }> = {};
        exercises.forEach((s) => {
          const date = dayMap[s.workout_day_id];
          if (!date) return;
          if (!maxWeightMap[s.name] || s.weight > maxWeightMap[s.name].max) {
            maxWeightMap[s.name] = { date, max: s.weight };
          }
        });

        useMaxLoadStore.getState().setMaxWeightData(
          Object.values(maxWeightMap).map((v) => ({ date: v.date, max_weight: v.max }))
        );
        useVolumeLoadStore.getState().setVolumeLoadData(
          flat.map((f) => ({ date: f.date, volume_load: f.volumeLoad, exerciseName: f.exerciseName }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    })();
  }, [userID]);

  /* ---------- derived data ---------- */

  const today = getTodayIST();
  const todayWorkout = dayWorkouts.find((d) => d.date === today);
  const pastWorkouts = dayWorkouts.filter((d) => d.date !== today);

  const totalVolume = useMemo(
    () => dayWorkouts.reduce((s, d) => s + d.exercises.reduce((a, e) => a + e.volumeLoad, 0), 0),
    [dayWorkouts]
  );

  const totalSets = useMemo(
    () => dayWorkouts.reduce((s, d) => s + d.exercises.reduce((a, e) => a + e.totalSets, 0), 0),
    [dayWorkouts]
  );

  const uniqueExercises = useMemo(
    () => new Set(dayWorkouts.flatMap((d) => d.exercises.map((e) => e.exerciseName))).size,
    [dayWorkouts]
  );

  /* weekly mini-chart data (last 7 days) */
  const weeklyChartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const dayData = dayWorkouts.find((w) => w.date === dateStr);
      const vol = dayData ? dayData.exercises.reduce((s, e) => s + e.volumeLoad, 0) : 0;
      return { label: WEEKDAYS[d.getDay()], value: vol };
    });
  }, [dayWorkouts]);

  /* top exercises across all time */
  const topExercises = useMemo(() => {
    const map: Record<string, { vol: number; sets: number }> = {};
    dayWorkouts.forEach((d) =>
      d.exercises.forEach((e) => {
        if (!map[e.exerciseName]) map[e.exerciseName] = { vol: 0, sets: 0 };
        map[e.exerciseName].vol += e.volumeLoad;
        map[e.exerciseName].sets += e.totalSets;
      })
    );
    return Object.entries(map)
      .map(([name, v]) => ({ name, volume: v.vol, sets: v.sets }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 8);
  }, [dayWorkouts]);

  const topMax = topExercises[0]?.volume || 1;

  /* ---------- UI ---------- */

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );

  if (error)
    return <p className="text-center text-sm text-red-500 py-6">{error}</p>;

  if (dayWorkouts.length === 0)
    return (
      <div className="flex flex-col items-center py-16 gap-2">
        <span className="text-3xl">🏋️</span>
        <p className="text-sm text-muted-foreground">No workout data yet. Start logging!</p>
      </div>
    );

  return (
    <div className="space-y-5">
      {/* ---- STAT CARDS ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Volume" value={totalVolume} sub="reps × kg" accent="text-emerald-500" />
        <StatCard label="Total Sets" value={totalSets} />
        <StatCard label="Exercises" value={uniqueExercises} />
        <StatCard label="Active Days" value={dayWorkouts.length} />
      </div>

      {/* ---- WEEKLY ACTIVITY MINI-CHART ---- */}
      <MiniChart data={weeklyChartData} title="Last 7 Days Volume"  accentColor="bg-emerald-500" />

      {/* ---- TOP EXERCISES BAR CHART ---- */}
      {topExercises.length > 0 && (
        <div className="rounded-2xl border border-foreground/6 bg-foreground/2 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Top Exercises by Volume
            </span>
          </div>
          <div className="space-y-2">
            {topExercises.map((ex) => (
              <VolumeBar key={ex.name} name={ex.name} volume={ex.volume} sets={ex.sets} max={topMax} />
            ))}
          </div>
        </div>
      )}

      {/* ---- TODAY'S SESSION ---- */}
      <div className="rounded-2xl border border-foreground/6 bg-foreground/2 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Today
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{today}</span>
        </div>

        {todayWorkout ? (
          <div className="space-y-2">
            <p className="text-lg font-bold tabular-nums text-amber-500">
              {todayWorkout.exercises.reduce((s, e) => s + e.volumeLoad, 0).toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground ml-1">total vol</span>
            </p>
            {todayWorkout.exercises.map((ex) => (
              <VolumeBar key={ex.exerciseName} name={ex.exerciseName} volume={ex.volumeLoad} sets={ex.totalSets} max={todayWorkout.exercises[0].volumeLoad} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No workouts logged today.</p>
        )}
      </div>

      {/* ---- PAST SESSIONS (compact accordion style) ---- */}
      {pastWorkouts.length > 0 && (
        <div className="rounded-2xl border border-foreground/6 bg-foreground/2 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Recent Sessions
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
            {pastWorkouts.slice(0, 10).map((day) => {
              const total = day.exercises.reduce((s, e) => s + e.volumeLoad, 0);
              return (
                <details key={day.date} className="group rounded-lg border border-foreground/4 bg-foreground/1 overflow-hidden">
                  <summary className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none hover:bg-foreground/3 transition-colors">
                    <span className="text-sm font-medium text-foreground">{day.date}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs tabular-nums text-muted-foreground">{day.exercises.length} exercises</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{total.toLocaleString()}</span>
                      <svg className="w-3.5 h-3.5 text-muted-foreground transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </summary>
                  <div className="px-4 pb-3 pt-1 space-y-1.5">
                    {day.exercises.map((ex) => (
                      <VolumeBar key={ex.exerciseName} name={ex.exerciseName} volume={ex.volumeLoad} sets={ex.totalSets} max={day.exercises[0].volumeLoad} />
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
