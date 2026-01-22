import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useUserStore } from "../../states/useAuthStore";
import { useMaxLoadStore } from "./states/maxweight";
import { useVolumeLoadStore } from "./states/volume_load_store";

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
        /* ---------- plans ---------- */
        const { data: plans } = await supabase
          .from("workout_plan")
          .select("id")
          .eq("user_id", userID);

        if (!plans?.length) {
          setDayWorkouts([]);
          return;
        }

        const planIds = plans.map((p) => p.id);

        /* ---------- workout days ---------- */
        const { data: workoutDays } = await supabase
          .from("workout_day")
          .select("id, created_at")
          .in("plan_id", planIds);

        if (!workoutDays?.length) {
          setDayWorkouts([]);
          return;
        }

        const dayMap: Record<string, string> = {};
        workoutDays.forEach((d) => {
          dayMap[d.id] = getISTDate(d.created_at);
        });

        const dayIds = workoutDays.map((d) => d.id);

        /* ---------- exercises ---------- */
        const { data: exercises } = await supabase
          .from("exercise")
          .select("name, weight, number_of_reps, workout_day_id")
          .in("workout_day_id", dayIds)
          .eq("is_the_exercise_done", true);

        if (!exercises?.length) {
          setDayWorkouts([]);
          return;
        }

        /* ---------- aggregate ---------- */

        const grouped: Record<
          string,
          { volumeLoad: number; sets: number }
        > = {};

        exercises.forEach((s) => {
          const date = dayMap[s.workout_day_id];
          if (!date) return;

          const key = `${date}|${s.name}`;
          const load = s.number_of_reps * s.weight;

          if (!grouped[key]) grouped[key] = { volumeLoad: 0, sets: 0 };
          grouped[key].volumeLoad += load;
          grouped[key].sets += 1;
        });

        const flat: ExerciseVolumeLoad[] = Object.entries(grouped).map(
          ([key, v]) => {
            const [date, exerciseName] = key.split("|");
            return {
              date,
              exerciseName,
              volumeLoad: v.volumeLoad,
              totalSets: v.sets,
            };
          }
        );

        const byDate: Record<string, ExerciseVolumeLoad[]> = {};
        flat.forEach((e) => {
          if (!byDate[e.date]) byDate[e.date] = [];
          byDate[e.date].push(e);
        });

        const result: DayWorkouts[] = Object.entries(byDate)
          .map(([date, exercises]) => ({
            date,
            exercises: exercises.sort(
              (a, b) => b.volumeLoad - a.volumeLoad
            ),
          }))
          .sort((a, b) => b.date.localeCompare(a.date));

        setDayWorkouts(result);

        /* ---------- stores ---------- */

        const maxWeightMap: Record<
          string,
          { date: string; max: number }
        > = {};

        exercises.forEach((s) => {
          const date = dayMap[s.workout_day_id];
          if (!date) return;
          if (
            !maxWeightMap[s.name] ||
            s.weight > maxWeightMap[s.name].max
          ) {
            maxWeightMap[s.name] = { date, max: s.weight };
          }
        });

        useMaxLoadStore.getState().setMaxWeightData(
          Object.values(maxWeightMap).map((v) => ({
            date: v.date,
            max_weight: v.max,
          }))
        );

        useVolumeLoadStore.getState().setVolumeLoadData(
          flat.map((f) => ({
            date: f.date,
            volume_load: f.volumeLoad,
            exerciseName: f.exerciseName,
          }))
        );
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [userID]);

  /* ---------- UI ---------- */

  if (loading)
    return (
      <p className="text-center text-sm text-muted-foreground py-6">
        Loading volume analytics…
      </p>
    );

  if (error)
    return (
      <p className="text-center text-sm text-red-500 py-6">
        {error}
      </p>
    );

  const today = getTodayIST();
  const todayWorkout = dayWorkouts.find((d) => d.date === today);
  const pastWorkouts = dayWorkouts.filter((d) => d.date !== today);

  return (
    <div className="max-w-3xl mx-auto px-3 py-6 space-y-6">
      <h2 className="text-xl font-semibold text-primary text-center">
        Workout Volume Load
      </h2>

      {/* ---------- TODAY ---------- */}
      <section className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-primary">
          Today ({today})
        </h3>

        {todayWorkout ? (
          <>
            <p className="text-sm text-muted-foreground">
              Total Volume Load:{" "}
              <span className="font-medium text-foreground">
                {todayWorkout.exercises
                  .reduce((s, e) => s + e.volumeLoad, 0)
                  .toLocaleString()}
              </span>
            </p>

            <ul className="space-y-2">
              {todayWorkout.exercises.map((ex) => (
                <li
                  key={ex.exerciseName}
                  className="flex justify-between text-sm"
                >
                  <span>{ex.exerciseName}</span>
                  <span className="text-muted-foreground">
                    {ex.volumeLoad.toLocaleString()} ({ex.totalSets} sets)
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No workouts completed today.
          </p>
        )}
      </section>

      {/* ---------- PAST ---------- */}
      <section className="space-y-4">
        <h3 className="font-semibold text-primary">
          Past Workouts
        </h3>

        {pastWorkouts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No past workouts yet.
          </p>
        )}

        {pastWorkouts.map((day) => {
          const total = day.exercises.reduce(
            (s, e) => s + e.volumeLoad,
            0
          );

          return (
            <div
              key={day.date}
              className="bg-secondary border border-border rounded-lg p-4 space-y-2"
            >
              <div className="flex justify-between text-sm font-medium">
                <span>{day.date}</span>
                <span>{total.toLocaleString()}</span>
              </div>

              <ul className="space-y-1 text-sm text-muted-foreground">
                {day.exercises.map((ex) => (
                  <li
                    key={ex.exerciseName}
                    className="flex justify-between"
                  >
                    <span>{ex.exerciseName}</span>
                    <span>
                      {ex.volumeLoad.toLocaleString()} ({ex.totalSets})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
