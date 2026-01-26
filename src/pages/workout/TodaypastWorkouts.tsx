import { useEffect, useState, useCallback } from "react";
import { Dumbbell, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useActivePlanStore } from "../../states/activeplan";
import type { ExerciseRow } from "../../models/exercise";

/* ---------------- IST helpers ---------------- */

function getTodayISTKey() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

function getISTKeyFromISOString(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

/* ---------------- icons ---------------- */

const IconStyle = (size = 16): React.CSSProperties => ({
  width: size,
  height: size,
  display: "inline-block",
  verticalAlign: "middle",
  fill: "currentColor",
});

// using lucide-react icons: Dumbbell, RefreshCw

/* ---------------- component ---------------- */

export default function TodaysPastWorkouts() {
  const activePlanId = useActivePlanStore((s) => s.id);

  const [workoutDayId, setWorkoutDayId] = useState<string | null>(null);
  const [groupedExercises, setGroupedExercises] = useState<
    Record<string, ExerciseRow[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  /* ---------- fetch today's workout ---------- */

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

      const todayWorkout = data?.find(
        (w) => getISTKeyFromISOString(w.created_at) === todayIST
      );

      setWorkoutDayId(todayWorkout?.id ?? null);
      setLoading(false);
    };

    fetchWorkoutDay();
  }, [activePlanId, refreshKey]);

  /* ---------- fetch exercises ---------- */

  const fetchExercises = useCallback(async () => {
    if (!workoutDayId) return;

    setLoading(true);

    const { data } = await supabase
      .from("exercise")
      .select("*")
      .eq("workout_day_id", workoutDayId)
      .order("created_at", { ascending: true });

    if (!data) {
      setLoading(false);
      return;
    }

    const grouped = data.reduce<Record<string, ExerciseRow[]>>(
      (acc, row) => {
        if (!acc[row.name]) acc[row.name] = [];
        acc[row.name].push(row);
        return acc;
      },
      {}
    );

    setGroupedExercises(grouped);
    setLoading(false);
  }, [workoutDayId]);

  useEffect(() => {
    if (!workoutDayId) return;
    fetchExercises();
  }, [workoutDayId, refreshKey, fetchExercises]);

  /* ---------------- UI ---------------- */

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading today's workouts…</p>;
  }

  if (!workoutDayId) {
    return (
      <div>
        <h3>
          <Dumbbell size={18} /> Today's Past Workouts
        </h3>
        <button onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshCw size={18} />
        </button>
        <p>No workout logged today.</p>
      </div>
    );
  }

  const exerciseNames = Object.keys(groupedExercises);

  if (exerciseNames.length === 0) {
    return (
      <div>
        <h3>
          <Dumbbell size={18} /> Today's Past Workouts
        </h3>
        <button onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshCw size={18} />
        </button>
        <p>No exercises recorded today.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3>
          <Dumbbell size={18} /> Today's Past Workouts
        </h3>
        <button onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshCw size={18} />
        </button>
      </div>

      {exerciseNames.map((exerciseName) => {
        const sets = groupedExercises[exerciseName];

        return (
          <div key={exerciseName} style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 12, textAlign: "center", fontWeight: 700, color: "var(--primary)" }}>{exerciseName}</h4>

            {/* ---------- column headers ---------- */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "33%",
                padding: "6px 0",
                fontSize: 13,
                opacity: 0.7,
                borderBottom: "1px solid var(--muted-border)",
              }}
            >
              <div>Set</div>
              <div>Reps</div>
              <div>Weight</div>
            </div>

            {/* ---------- rows ---------- */}
            {sets.map((s) => {
              const isBodyWeight = Boolean(
                (s as any).is_body_weighted ??
                (s as any).is_body_wieighted
              );

              return (
                <div
                  key={s.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "33%",
                    padding: "10px 0",
                    borderBottom: "1px dashed var(--muted-border)",
                  }}
                >
                  <div>Set {s.set_number}</div>
                  <div>{s.number_of_reps}</div>
                  <div>{isBodyWeight ? "Bodyweight" : `${s.weight} kg`}</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
