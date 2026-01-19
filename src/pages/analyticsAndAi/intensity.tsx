import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useUserStore } from "../../states/useAuthStore";

/* ---------- types ---------- */

type DayIntensity = {
  date: string;
  intensity: number;
};

type ExerciseSet = {
  weight: number;
  number_of_reps: number;
  set_number: number;
  workout_day: { created_at: string }[] | null;
};

/* ---------- helpers ---------- */

function estimate1RM(weight: number, reps: number) {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

/* ---------- component ---------- */

export default function IntensityAnalytics() {
  const userID = useUserStore((s) => s.userId);

  const [days, setDays] = useState<DayIntensity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userID) return;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("exercise")
        .select(`
          weight,
          number_of_reps,
          set_number,
          workout_day:workout_day_id ( created_at )
        `)
        .eq("is_the_exercise_done", true)
        .eq("user_id", userID);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data || !Array.isArray(data)) {
        setError("No workout data found.");
        setLoading(false);
        return;
      }

      const grouped: Record<string, number[]> = {};

      (data as ExerciseSet[]).forEach((set) => {
        // 🔒 normalize relation (Supabase always returns arrays)
        const workoutDay =
          Array.isArray(set.workout_day) && set.workout_day.length > 0
            ? set.workout_day[0]
            : null;

        if (!workoutDay?.created_at) return;

        const day = workoutDay.created_at.slice(0, 10);

        const est1RM = estimate1RM(set.weight, set.number_of_reps);
        if (!est1RM) return;

        const relative = set.weight / est1RM;
        const fatigue = 1 - (set.set_number - 1) * 0.05;
        const intensity = Math.max(0, Math.min(1, relative * fatigue));

        grouped[day] ??= [];
        grouped[day].push(intensity);
      });

      const result: DayIntensity[] = Object.entries(grouped)
        .map(([date, values]) => ({
          date,
          intensity:
            values.reduce((a, b) => a + b, 0) / values.length
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setDays(result);
      setLoading(false);
    })();
  }, [userID]);

  /* ---------- UI ---------- */

  if (loading) return <p>Loading intensity data…</p>;

  return (
    <div>
      <h3>Workout Intensity (Daily)</h3>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {!error && days.length === 0 && (
        <p>No completed workouts yet.</p>
      )}

      {days.map((d) => (
        <div key={d.date}>
          {d.date} → {(d.intensity * 100).toFixed(1)}%
        </div>
      ))}
    </div>
  );
}
