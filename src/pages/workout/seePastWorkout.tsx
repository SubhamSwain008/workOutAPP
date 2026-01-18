import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useCurretWorkoutStore } from "../../states/curretActiveWorkout";
import { useActivePlanStore } from "../../states/activeplan";
import type { ExerciseRow } from "../../models/exercise";

/* ---------- helpers ---------- */

function getISTDateKey(date: string) {
  return new Date(date).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata"
  });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  });
}

/* ---------- component ---------- */

export default function SeePastWorkout() {
  const workoutName = useCurretWorkoutStore(
    (s) => s.currentActiveWorkoutName
  );
  const activePlanId = useActivePlanStore((s) => s.id);

  const [pastSessions, setPastSessions] = useState<
    { workoutDayId: string; date: string; sets: ExerciseRow[] }[]
  >([]);
  const [loading, setLoading] = useState(true);

  /* ---------- fetch past workouts ---------- */

  useEffect(() => {
    if (!workoutName || !activePlanId) return;

    const fetchPastWorkouts = async () => {
      setLoading(true);

      // 1️⃣ find today's workout_day (to exclude)
      const todayKey = getISTDateKey(new Date().toISOString());

      const { data: days } = await supabase
        .from("workout_day")
        .select("id, created_at")
        .eq("plan_id", activePlanId)
        .order("created_at", { ascending: false });

      if (!days || days.length === 0) {
        setPastSessions([]);
        setLoading(false);
        return;
      }

      // 2️⃣ exclude today's workout_day
      const pastDays = days.filter(
        (d) => getISTDateKey(d.created_at) !== todayKey
      );

      if (pastDays.length === 0) {
        setPastSessions([]);
        setLoading(false);
        return;
      }

      // Only need last 2 workout days
      const targetDayIds = pastDays.slice(0, 2).map((d) => d.id);

      // 3️⃣ fetch exercise sets for those days
      const { data: sets } = await supabase
        .from("exercise")
        .select("*")
        .eq("name", workoutName)
        .in("workout_day_id", targetDayIds)
        .order("set_number", { ascending: true });

      if (!sets || sets.length === 0) {
        setPastSessions([]);
        setLoading(false);
        return;
      }

      // 4️⃣ group by workout_day_id
      const grouped: Record<string, ExerciseRow[]> = {};
      sets.forEach((s) => {
        if (!grouped[s.workout_day_id]) {
          grouped[s.workout_day_id] = [];
        }
        grouped[s.workout_day_id].push(s);
      });

      // 5️⃣ shape final output
      const sessions = targetDayIds
        .filter((id) => grouped[id])
        .map((id) => {
          const day = pastDays.find((d) => d.id === id)!;
          return {
            workoutDayId: id,
            date: day.created_at,
            sets: grouped[id]
          };
        });

      setPastSessions(sessions);
      setLoading(false);
    };

    fetchPastWorkouts();
  }, [workoutName, activePlanId]);

  /* ---------- UI ---------- */

  if (!workoutName) {
    return <p>No active workout selected.</p>;
  }

  if (loading) {
    return <p>Loading past workouts…</p>;
  }

  if (pastSessions.length === 0) {
    return <p>No past workouts found for {workoutName}.</p>;
  }

  return (
    <div>
      <h3>Past Workouts — {workoutName}</h3>

      {pastSessions.map((session) => (
        <div key={session.workoutDayId} style={{ marginBottom: 16 }}>
          <strong>{formatDate(session.date)}</strong>

          <ul>
            {session.sets.map((s) => (
              <li key={s.id}>
                Set {s.set_number}: {s.number_of_reps} reps ×{" "}
                {s.weight} kg
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
