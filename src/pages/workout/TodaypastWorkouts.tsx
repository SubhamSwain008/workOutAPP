import { useEffect, useState, useCallback } from "react";
import { Dumbbell, RefreshCw, Trophy, Flame, Calendar, History, Repeat } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useActivePlanStore } from "../../states/activeplan";
import { formatDayType } from "../../lib/formatDayType";
import type { ExerciseRow } from "../../models/exercise";

/* ---------- IST helpers ---------- */
function getTodayISTKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
function getISTKeyFromISOString(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  });
}

/* ---------- types ---------- */
type PastSession = {
  workoutDayId: string;
  date: string;
  dayType: string;
  exercises: Record<string, ExerciseRow[]>;
};

type Tab = "today" | "sameDayHistory";

export default function TodaysPastWorkouts() {
  const activePlanId = useActivePlanStore((s) => s.id);

  const [activeTab, setActiveTab] = useState<Tab>("today");

  /* --- Today state --- */
  const [workoutDayId, setWorkoutDayId] = useState<string | null>(null);
  const [todayDayType, setTodayDayType] = useState<string>("");
  const [groupedExercises, setGroupedExercises] = useState<Record<string, ExerciseRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  /* --- Same-day history state --- */
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [pastLoading, setPastLoading] = useState(false);

  /* ---------- Fetch today's workout day ---------- */
  useEffect(() => {
    if (!activePlanId) return;
    const fetchWorkoutDay = async () => {
      setLoading(true);
      const todayIST = getTodayISTKey();
      const { data } = await supabase
        .from("workout_day")
        .select("id, created_at, day_type_name")
        .eq("plan_id", activePlanId)
        .order("created_at", { ascending: false });
      const todayWorkout = data?.find((w) => getISTKeyFromISOString(w.created_at) === todayIST);
      setWorkoutDayId(todayWorkout?.id ?? null);
      setTodayDayType(todayWorkout ? formatDayType(todayWorkout.day_type_name) : "");
      setLoading(false);
    };
    fetchWorkoutDay();
  }, [activePlanId, refreshKey]);

  /* ---------- Fetch today's exercises ---------- */
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

  /* ---------- Fetch same-day-type past sessions ---------- */
  useEffect(() => {
    if (!activePlanId || !todayDayType || activeTab !== "sameDayHistory") return;

    const fetchPastSameDaySessions = async () => {
      setPastLoading(true);
      const todayIST = getTodayISTKey();

      const { data: days } = await supabase
        .from("workout_day")
        .select("id, created_at, day_type_name")
        .eq("plan_id", activePlanId)
        .order("created_at", { ascending: false });

      if (!days?.length) { setPastSessions([]); setPastLoading(false); return; }

      // Find days with matching day_type_name (same day type like Push, Pull, etc.)
      const matchingPastDays = days.filter((d) => {
        if (getISTKeyFromISOString(d.created_at) === todayIST) return false;
        return formatDayType(d.day_type_name) === todayDayType;
      });

      if (matchingPastDays.length === 0) { setPastSessions([]); setPastLoading(false); return; }

      // Take the last 5 matching sessions
      const targetDays = matchingPastDays.slice(0, 5);
      const targetDayIds = targetDays.map((d) => d.id);

      const { data: exercises } = await supabase
        .from("exercise")
        .select("*")
        .in("workout_day_id", targetDayIds)
        .eq("is_the_exercise_done", true)
        .order("created_at", { ascending: true });

      if (!exercises?.length) { setPastSessions([]); setPastLoading(false); return; }

      const sessions: PastSession[] = targetDays
        .map((day) => {
          const dayExercises = exercises.filter((e) => e.workout_day_id === day.id);
          if (dayExercises.length === 0) return null;
          const grouped = dayExercises.reduce<Record<string, ExerciseRow[]>>((acc, row) => {
            if (!acc[row.name]) acc[row.name] = [];
            acc[row.name].push(row);
            return acc;
          }, {});
          return {
            workoutDayId: day.id,
            date: day.created_at,
            dayType: formatDayType(day.day_type_name),
            exercises: grouped,
          };
        })
        .filter(Boolean) as PastSession[];

      setPastSessions(sessions);
      setPastLoading(false);
    };

    fetchPastSameDaySessions();
  }, [activePlanId, todayDayType, activeTab]);

  /* ---------- Derived ---------- */
  const exerciseNames = Object.keys(groupedExercises);
  const totalSets = Object.values(groupedExercises).flat().length;
  const totalVolume = Object.values(groupedExercises)
    .flat()
    .reduce((acc, s) => {
      const bw = Boolean((s as any).is_body_weighted ?? (s as any).is_body_wieighted);
      return acc + s.number_of_reps * (bw ? 0 : s.weight);
    }, 0);

  /* ---------- UI ---------- */
  if (loading && !workoutDayId) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-[workout-fade-in_0.3s_ease-out_both]">
      {/* ---- Tab bar ---- */}
      <div className="flex items-center border-b border-border/50">
        <button
          onClick={() => setActiveTab("today")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all touch-manipulation relative
            ${activeTab === "today"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/70"
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Flame className="w-4 h-4" />
            <span>Today's Log</span>
            {totalSets > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                {totalSets}
              </span>
            )}
          </div>
          {activeTab === "today" && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("sameDayHistory")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all touch-manipulation relative
            ${activeTab === "sameDayHistory"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground/70"
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <History className="w-4 h-4" />
            <span>Past {todayDayType || "Day"}</span>
          </div>
          {activeTab === "sameDayHistory" && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
          )}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setRefreshKey((k) => k + 1); }}
          className="px-3 py-3 hover:bg-secondary/50 transition-colors touch-manipulation"
        >
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* ---- Today's Log tab ---- */}
      {activeTab === "today" && (
        <div className="animate-[workout-fade-in_0.2s_ease-out_both]">
          {/* Summary bar */}
          {exerciseNames.length > 0 && (
            <div className="px-5 py-3 border-b border-border/30 bg-secondary/20">
              <p className="text-xs text-muted-foreground">
                {exerciseNames.length} exercise{exerciseNames.length !== 1 ? "s" : ""} &middot;{" "}
                {totalSets} set{totalSets !== 1 ? "s" : ""}
                {totalVolume > 0 && <> &middot; {totalVolume.toLocaleString()} vol</>}
              </p>
            </div>
          )}

          {exerciseNames.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <Dumbbell className="w-5 h-5 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground/70">No exercises completed yet. Start your first exercise above!</p>
            </div>
          ) : (
            <div className="px-4 pb-4 pt-3 space-y-2.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {exerciseNames.map((name, idx) => {
                const sets = groupedExercises[name];
                const exerciseVolume = sets.reduce((acc, s) => {
                  const bw = Boolean((s as any).is_body_weighted ?? (s as any).is_body_wieighted);
                  return acc + s.number_of_reps * (bw ? 0 : s.weight);
                }, 0);

                return (
                  <div
                    key={name}
                    className="rounded-xl bg-secondary/40 border border-border/30 overflow-hidden"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-primary" />
                        <span className="text-sm font-bold text-foreground">{name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {sets.length} set{sets.length !== 1 ? "s" : ""}
                        {exerciseVolume > 0 && <> &middot; {exerciseVolume.toLocaleString()} vol</>}
                      </span>
                    </div>
                    <div className="px-4 pb-2.5">
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1">
                        <span>Set</span>
                        <span>Reps</span>
                        <span>Weight</span>
                      </div>
                      {sets.map((s) => {
                        const isBodyWeight = Boolean((s as any).is_body_weighted ?? (s as any).is_body_wieighted);
                        return (
                          <div
                            key={s.id}
                            className="grid grid-cols-3 gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-secondary/60 transition-colors"
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
      )}

      {/* ---- Same Day History tab ---- */}
      {activeTab === "sameDayHistory" && (
        <div className="animate-[workout-fade-in_0.2s_ease-out_both]">
          {pastLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : pastSessions.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <History className="w-5 h-5 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground/70">
                No past <span className="font-semibold text-foreground">{todayDayType || "day"}</span> sessions found
              </p>
            </div>
          ) : (
            <div className="px-4 pb-4 pt-3 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {pastSessions.map((session) => {
                const allSets = Object.values(session.exercises).flat();
                const sessionVolume = allSets.reduce((acc, s) => {
                  const bw = Boolean((s as any).is_body_weighted ?? (s as any).is_body_wieighted);
                  return acc + s.number_of_reps * (bw ? 0 : s.weight);
                }, 0);

                return (
                  <div key={session.workoutDayId} className="rounded-xl bg-secondary/40 border border-border/30 overflow-hidden">
                    {/* Session header */}
                    <div className="px-4 py-2.5 flex items-center justify-between border-b border-border/20 bg-secondary/30">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-semibold text-foreground">{formatDate(session.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{Object.keys(session.exercises).length} exercises</span>
                        {sessionVolume > 0 && (
                          <span className="font-medium">&middot; {sessionVolume.toLocaleString()} vol</span>
                        )}
                      </div>
                    </div>

                    {/* Exercises in this session */}
                    <div className="px-3 py-2 space-y-2">
                      {Object.entries(session.exercises).map(([exerciseName, sets]) => {
                        const exVol = sets.reduce((acc, s) => {
                          const bw = Boolean((s as any).is_body_weighted ?? (s as any).is_body_wieighted);
                          return acc + s.number_of_reps * (bw ? 0 : s.weight);
                        }, 0);

                        return (
                          <div key={exerciseName} className="rounded-lg bg-background/50 border border-border/20 overflow-hidden">
                            <div className="px-3 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Trophy className="w-3 h-3 text-primary" />
                                <span className="text-xs font-bold text-foreground">{exerciseName}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {sets.length} set{sets.length !== 1 ? "s" : ""}
                                {exVol > 0 && <> &middot; {exVol.toLocaleString()} vol</>}
                              </span>
                            </div>
                            <div className="px-3 pb-2">
                              {sets.map((s) => {
                                const isBodyWeight = Boolean((s as any).is_body_weighted ?? (s as any).is_body_wieighted);
                                return (
                                  <div key={s.id} className="flex items-center gap-3 py-1 text-xs">
                                    <span className="text-muted-foreground w-5 font-medium">#{s.set_number}</span>
                                    <span className="flex items-center gap-1 text-foreground">
                                      <Repeat className="w-2.5 h-2.5 text-muted-foreground" />
                                      <span className="font-semibold">{s.number_of_reps}</span>
                                    </span>
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
