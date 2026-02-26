import { useEffect, useState, useCallback } from "react";
import { Dumbbell, RefreshCw, ChevronDown, ChevronUp, Trophy, Flame } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useActivePlanStore } from "../../states/activeplan";
import type { ExerciseRow } from "../../models/exercise";

/* ---------- IST helpers ---------- */
function getTodayISTKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
function getISTKeyFromISOString(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export default function TodaysPastWorkouts() {
  const activePlanId = useActivePlanStore((s) => s.id);

  const [workoutDayId, setWorkoutDayId] = useState<string | null>(null);
  const [groupedExercises, setGroupedExercises] = useState<Record<string, ExerciseRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!activePlanId) return;
    const fetchWorkoutDay = async () => {
      setLoading(true);
      const todayIST = getTodayISTKey();
      const { data } = await supabase
        .from("workout_day")
        .select("id, created_at")
        .eq("plan_id", activePlanId)
        .order("created_at", { ascending: false });
      const todayWorkout = data?.find((w) => getISTKeyFromISOString(w.created_at) === todayIST);
      setWorkoutDayId(todayWorkout?.id ?? null);
      setLoading(false);
    };
    fetchWorkoutDay();
  }, [activePlanId, refreshKey]);

  const fetchExercises = useCallback(async () => {
    if (!workoutDayId) return;
    setLoading(true);
    const { data } = await supabase
      .from("exercise")
      .select("*")
      .eq("workout_day_id", workoutDayId)
      .order("created_at", { ascending: true });
    if (!data) { setLoading(false); return; }
    const grouped = data.reduce<Record<string, ExerciseRow[]>>((acc, row) => {
      if (!acc[row.name]) acc[row.name] = [];
      acc[row.name].push(row);
      return acc;
    }, {});
    setGroupedExercises(grouped);
    setLoading(false);
  }, [workoutDayId]);

  useEffect(() => {
    if (!workoutDayId) return;
    fetchExercises();
  }, [workoutDayId, refreshKey, fetchExercises]);

  const exerciseNames = Object.keys(groupedExercises);
  const totalSets = Object.values(groupedExercises).flat().length;
  const totalVolume = Object.values(groupedExercises)
    .flat()
    .reduce((acc, s) => {
      const bw = Boolean((s as any).is_body_weighted ?? (s as any).is_body_wieighted);
      return acc + s.number_of_reps * (bw ? 0 : s.weight);
    }, 0);

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!workoutDayId || exerciseNames.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Today's Log</h3>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors touch-manipulation"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground/70">No exercises completed yet. Start your first exercise above!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-[workout-fade-in_0.3s_ease-out_both]">
      {/* Header with toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-chart-3/10">
            <Flame className="w-4.5 h-4.5 text-chart-3" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-foreground">Today's Log</h3>
            <p className="text-xs text-muted-foreground">
              {exerciseNames.length} exercise{exerciseNames.length !== 1 ? "s" : ""} &middot;
              {totalSets} set{totalSets !== 1 ? "s" : ""}
              {totalVolume > 0 && <> &middot; {totalVolume.toLocaleString()} kg</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setRefreshKey((k) => k + 1); }}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors touch-manipulation"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Exercise list */}
      {isExpanded && (
        <div className="px-5 pb-4 space-y-3 animate-[workout-fade-in_0.2s_ease-out_both]">
          {exerciseNames.map((exerciseName, idx) => {
            const sets = groupedExercises[exerciseName];
            const exerciseVolume = sets.reduce((acc, s) => {
              const bw = Boolean((s as any).is_body_weighted ?? (s as any).is_body_wieighted);
              return acc + s.number_of_reps * (bw ? 0 : s.weight);
            }, 0);

            return (
              <div
                key={exerciseName}
                className="rounded-xl bg-secondary/40 border border-border/30 overflow-hidden"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Exercise name header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-bold text-foreground">{exerciseName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {sets.length} set{sets.length !== 1 ? "s" : ""}
                    {exerciseVolume > 0 && <> &middot; {exerciseVolume.toLocaleString()} kg</>}
                  </span>
                </div>

                {/* Set rows */}
                <div className="px-4 pb-3">
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1.5">
                    <span>Set</span>
                    <span>Reps</span>
                    <span>Weight</span>
                  </div>
                  {sets.map((s) => {
                    const isBodyWeight = Boolean((s as any).is_body_weighted ?? (s as any).is_body_wieighted);
                    return (
                      <div
                        key={s.id}
                        className="grid grid-cols-3 gap-2 px-2 py-1.5 rounded-lg text-sm
                                   hover:bg-secondary/60 transition-colors"
                      >
                        <span className="font-medium text-muted-foreground">#{s.set_number}</span>
                        <span className="font-semibold text-foreground">{s.number_of_reps}</span>
                        <span className="font-medium text-foreground">
                          {isBodyWeight ? "BW" : `${s.weight} kg`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
