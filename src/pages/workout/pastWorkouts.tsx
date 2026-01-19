import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useActivePlanStore } from "../../states/activeplan";
import type { ExerciseRow } from "../../models/exercise";

/* ---------------- IST helpers ---------------- */

function getTodayISTKey() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata"
  });
}

function getISTKeyFromISOString(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata"
  });
}

/* ---------------- helper ---------------- */

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* ---------------- component ---------------- */

export default function TodaysPastWorkouts() {
  const activePlanId = useActivePlanStore((s) => s.id);

  const [workoutDayId, setWorkoutDayId] = useState<string | null>(null);
  const [groupedExercises, setGroupedExercises] = useState<
    Record<string, ExerciseRow[]>
  >({});
  const [loading, setLoading] = useState(true);

  /* ---------- fetch today's workout_day ---------- */

  useEffect(() => {
    if (!activePlanId) return;

    const fetchWorkoutDay = async () => {
      const todayIST = getTodayISTKey();

      const { data: allData, error } = await supabase
        .from("workout_day")
        .select("id, created_at")
        .eq("plan_id", activePlanId)
        .order("created_at", { ascending: false });

      if (error || !allData) {
        setLoading(false);
        return;
      }

      // Find today's workout using IST comparison
      const todayWorkout = allData.find(
        (w) => getISTKeyFromISOString(w.created_at) === todayIST
      );

      if (!todayWorkout) {
        setLoading(false);
        return;
      }

      setWorkoutDayId(todayWorkout.id);
    };

    fetchWorkoutDay();
  }, [activePlanId]);

  /* ---------- fetch & group today's exercises ---------- */

  useEffect(() => {
    if (!workoutDayId) return;

    const fetchExercises = async () => {
      const { data, error } = await supabase
        .from("exercise")
        .select("*")
        .eq("workout_day_id", workoutDayId)
        .order("created_at", { ascending: true });

      if (error || !data) {
        setLoading(false);
        return;
      }

      // 🔥 group by exercise name
      const grouped = data.reduce<Record<string, ExerciseRow[]>>(
        (acc, row) => {
          if (!acc[row.name]) {
            acc[row.name] = [];
          }
          acc[row.name].push(row);
          return acc;
        },
        {}
      );

      setGroupedExercises(grouped);
      setLoading(false);
    };

    fetchExercises();
  }, [workoutDayId]);

  /* ---------------- UI ---------------- */

  if (loading) {
    return <p>Loading today's workouts...</p>;
  }

  if (!workoutDayId) {
    return <p>No workout logged today.</p>;
  }

  const exerciseNames = Object.keys(groupedExercises);

  if (exerciseNames.length === 0) {
    return <p>No exercises recorded today.</p>;
  }

  return (
    <div>
      <h2>Today's Past Workouts</h2>

      {exerciseNames.map((exerciseName) => {
        const sets = groupedExercises[exerciseName];
        const muscles = sets[0]?.targated_muscles ?? [];

        return (
          <div key={exerciseName} style={{ marginBottom: 16 }}>
            <h4>{exerciseName}</h4>

            {muscles.length > 0 && (
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Targeted muscles: {muscles.join(", ")}
              </div>
            )}

            <ul>
              {sets.map((s) => (
                <li key={s.id}>
                  Set {s.set_number}: {s.number_of_reps} reps ×{" "}
                  {s.weight} kg{" "}
                  <small>({formatTime(s.created_at)})</small>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
