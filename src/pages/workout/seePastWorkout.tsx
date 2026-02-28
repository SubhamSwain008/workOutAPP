import { useEffect, useState } from "react";
import { Calendar, Clock, Repeat, History, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCurretWorkoutStore } from "../../states/curretActiveWorkout";
import { useActivePlanStore } from "../../states/activeplan";
import type { ExerciseRow } from "../../models/exercise";

/* ---------- helpers ---------- */
function getISTDateKey(date: string) {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  });
}

export default function SeePastWorkout() {
  const workoutName = useCurretWorkoutStore((s) => s.currentActiveWorkoutName);
  const activePlanId = useActivePlanStore((s) => s.id);

  const [pastSessions, setPastSessions] = useState<
    { workoutDayId: string; date: string; sets: ExerciseRow[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!workoutName || !activePlanId) return;

    const fetchPastWorkouts = async () => {
      setLoading(true);
      const todayKey = getISTDateKey(new Date().toISOString());

      const { data: days } = await supabase
        .from("workout_day")
        .select("id, created_at")
        .eq("plan_id", activePlanId)
        .order("created_at", { ascending: false });

      if (!days || days.length === 0) { setPastSessions([]); setLoading(false); return; }

      const pastDays = days.filter((d) => getISTDateKey(d.created_at) !== todayKey);
      if (pastDays.length === 0) { setPastSessions([]); setLoading(false); return; }

      const allPastDayIds = pastDays.map((d) => d.id);

      // Query exercises across ALL past days (not just last 2) to find sessions with this exercise
      const { data: sets } = await supabase
        .from("exercise")
        .select("*")
        .eq("name", workoutName)
        .in("workout_day_id", allPastDayIds)
        .order("set_number", { ascending: true });

      if (!sets || sets.length === 0) { setPastSessions([]); setLoading(false); return; }

      const grouped: Record<string, ExerciseRow[]> = {};
      sets.forEach((s) => {
        if (!grouped[s.workout_day_id]) grouped[s.workout_day_id] = [];
        grouped[s.workout_day_id].push(s);
      });

      // Get the most recent 3 sessions that actually had this exercise
      const sessions = Object.keys(grouped)
        .map((id) => {
          const day = pastDays.find((d) => d.id === id)!;
          return { workoutDayId: id, date: day.created_at, sets: grouped[id] };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

      setPastSessions(sessions);
      setLoading(false);
    };

    fetchPastWorkouts();
  }, [workoutName, activePlanId]);

  if (!workoutName) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (pastSessions.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="w-4 h-4" />
          <span className="text-sm">No past data for <span className="font-semibold text-foreground">{workoutName}</span></span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-[workout-fade-in_0.3s_ease-out_both]">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-secondary/30 transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-chart-4/10">
            <History className="w-4 h-4 text-chart-4" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold text-foreground">Past Performance</h4>
            <p className="text-xs text-muted-foreground">{workoutName} &middot; Last {pastSessions.length} session{pastSessions.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isExpanded && (
        <div className="px-5 pb-4 space-y-3 animate-[workout-fade-in_0.2s_ease-out_both]">
          {pastSessions.map((session) => (
            <div key={session.workoutDayId} className="rounded-xl bg-secondary/40 border border-border/30 overflow-hidden">
              {/* Session date */}
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-border/20">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-medium">{formatDate(session.date)}</span>
                </div>
                <span className="text-xs text-muted-foreground">{session.sets.length} set{session.sets.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Sets */}
              <div className="px-4 py-2">
                {session.sets.map((s) => {
                  const isBodyWeight = Boolean((s as any).is_body_weighted ?? (s as any).is_body_wieighted);
                  return (
                    <div key={s.id} className="flex items-center justify-between py-1.5 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-8">#{s.set_number}</span>
                        <span className="flex items-center gap-1 text-foreground">
                          <Repeat className="w-3 h-3 text-muted-foreground" />
                          <span className="font-semibold">{s.number_of_reps}</span>
                        </span>
                        <span className="font-medium text-foreground">
                          {isBodyWeight ? "BW" : `${s.weight} kg`}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(s.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
