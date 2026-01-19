import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useUserStore } from "../../states/useAuthStore";
import { useMaxLoadStore } from "./states/maxweight";
import { useVolumeLoadStore } from "./states/volume_load_store";

/* ---------- types ---------- */

type ExerciseVolume_Load = {
  date: string;
  exerciseName: string;
  Volume_Load: number; // sets * reps * weight
  totalSets: number;
};

type DayWorkouts = {
  date: string;
  exercises: ExerciseVolume_Load[];
};

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
        /* ---------- Step 1: plans ---------- */
        const { data: plans, error: plansError } = await supabase
          .from("workout_plan")
          .select("id")
          .eq("user_id", userID);

        if (plansError) throw new Error(plansError.message);
        if (!plans?.length) {
          setDayWorkouts([]);
          return;
        }

        const planIds = plans.map((p) => p.id);

        /* ---------- Step 2: workout days ---------- */
        const { data: workoutDays, error: daysError } = await supabase
          .from("workout_day")
          .select("id, created_at")
          .in("plan_id", planIds);

        if (daysError) throw new Error(daysError.message);
        if (!workoutDays?.length) {
          setDayWorkouts([]);
          return;
        }

        // Helper to get YYYY-MM-DD in IST
        function getISTDateString(iso: string) {
          return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        }

        const dayMeta: Record<string, string> = {};
        workoutDays.forEach((d) => {
          dayMeta[d.id] = getISTDateString(d.created_at);
        });

        const dayIds = workoutDays.map((d) => d.id);

        /* ---------- Step 3: exercises ---------- */
        const { data: exercises, error: exercisesError } = await supabase
          .from("exercise")
          .select("name, weight, number_of_reps, set_number, workout_day_id")
          .in("workout_day_id", dayIds)
          .eq("is_the_exercise_done", true);

        if (exercisesError) throw new Error(exercisesError.message);
        if (!exercises?.length) {
          setDayWorkouts([]);
          return;
        }

        /* ---------- Step 4: Group by date + exercise name ---------- */
        // Key: "date|exerciseName"
        const grouped: Record<string, { totalVolume_Load: number; totalSets: number }> = {};

        exercises.forEach((set) => {
          const date = dayMeta[set.workout_day_id];
          if (!date || !set.name) return;

          const key = `${date}|${set.name}`;

          // Volume_Load = sets * reps * weight (for each set, it's 1 * reps * weight)
          const setVolume_Load = set.number_of_reps * set.weight;

          if (!grouped[key]) {
            grouped[key] = { totalVolume_Load: 0, totalSets: 0 };
          }
          grouped[key].totalVolume_Load += setVolume_Load;
          grouped[key].totalSets += 1;
        });

        /* ---------- Step 5: Convert to array and group by date ---------- */
        const exerciseList: ExerciseVolume_Load[] = Object.entries(grouped).map(([key, data]) => {
          const [date, exerciseName] = key.split("|");
          return {
            date,
            exerciseName,
            Volume_Load: data.totalVolume_Load,
            totalSets: data.totalSets,
          };
        });

        // Group by date
        const byDate: Record<string, ExerciseVolume_Load[]> = {};
        exerciseList.forEach((ex) => {
          if (!byDate[ex.date]) {
            byDate[ex.date] = [];
          }
          byDate[ex.date].push(ex);
        });

        // Sort dates and exercises
        const result: DayWorkouts[] = Object.entries(byDate)
          .map(([date, exercises]) => ({
            date,
            exercises: exercises.sort((a, b) => b.Volume_Load - a.Volume_Load),
          }))
          .sort((a, b) => b.date.localeCompare(a.date)); // newest first

        setDayWorkouts(result);
        // --- Store max weight and exercise name ---
        // Find max weight per exercise (across all days)
        const maxWeightMap: Record<string, { date: string; max_weight: number }> = {};
        exercises.forEach((set) => {
          const date = dayMeta[set.workout_day_id];
          if (!date || !set.name) return;
          if (!maxWeightMap[set.name] || set.weight > maxWeightMap[set.name].max_weight) {
            maxWeightMap[set.name] = { date, max_weight: set.weight };
          }
        });
        const maxWeightArr = Object.entries(maxWeightMap).map(([exerciseName, { date, max_weight }]) => ({ date, max_weight, exerciseName }));
        // Store in zustand store (exerciseName is for context, but store all maxes)
        useMaxLoadStore.getState().setMaxWeightData(
          maxWeightArr.map(({ date, max_weight }) => ({ date, max_weight }))
        );
        // Optionally, set the first exercise name as current
        if (maxWeightArr.length > 0) {
          useMaxLoadStore.getState().setExerciseName(maxWeightArr[0].exerciseName);
        }

        // --- Store volume load, date, and exercise name ---
        // Flatten all exercise volume loads
        const volumeLoadArr = exerciseList.map((ex) => ({
          date: ex.date,
          volume_load: ex.Volume_Load,
          exerciseName: ex.exerciseName,
        }));
        useVolumeLoadStore.getState().setVolumeLoadData(volumeLoadArr);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [userID]);

  /* ---------- UI ---------- */

  if (loading) return <p>Loading Volume_Load data…</p>;


  // Get today's date in YYYY-MM-DD format in IST
  function getTodayISTKey() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  }
  const today = getTodayISTKey();

  const todayWorkout = dayWorkouts.find((d) => d.date === today);
  const pastWorkouts = dayWorkouts.filter((d) => d.date !== today);

  // Calculate today's total Volume_Load
  const todayTotalVolume_Load = todayWorkout
    ? todayWorkout.exercises.reduce((sum, ex) => sum + ex.Volume_Load, 0)
    : 0;

  return (
    <div>
      <h3>Workout Volume_Load (Sets × Reps × Weight)</h3>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {/* ---------- Today's Workout ---------- */}
      <div>
        <h4>📅 Today ({today})</h4>
        {todayWorkout ? (
          <>
            <p>
              Total Volume_Load: {todayTotalVolume_Load.toLocaleString()}
            </p>
            <ul>
              {todayWorkout.exercises.map((ex) => (
                <li key={ex.exerciseName}>
                  {ex.exerciseName} Volume_Load = {ex.Volume_Load.toLocaleString()} ({ex.totalSets} sets)
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No workouts completed today.</p>
        )}
      </div>

      {/* ---------- Past Workouts ---------- */}
      <h4>📊 Past Workouts</h4>

      {pastWorkouts.length === 0 && (
        <p>No past workouts yet.</p>
      )}

      {pastWorkouts.map((day) => {
        const dayTotal = day.exercises.reduce((sum, ex) => sum + ex.Volume_Load, 0);
        return (
          <div key={day.date}>
            <strong>{day.date}</strong>
            <span>
              Total: {dayTotal.toLocaleString()}
            </span>
            <ul>
              {day.exercises.map((ex) => (
                <li key={ex.exerciseName}>
                  {ex.exerciseName} Volume_Load = {ex.Volume_Load.toLocaleString()} ({ex.totalSets} sets)
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
