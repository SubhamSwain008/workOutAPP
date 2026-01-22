import { useEffect, useState, useCallback } from "react";
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

function DumbbellIcon() {
  return (
    <svg style={IconStyle(18)} viewBox="0 0 24 24" aria-hidden>
      <path d="M20 8h-1.5l-2-2H17a1 1 0 0 0 0-2h-2a1 1 0 0 0 0 2h.5l-1.8 1.8A3 3 0 0 0 9 8.6L7.9 7.5A4 4 0 0 0 4 8v1H3a1 1 0 0 0 0 2h1v2H3a1 1 0 0 0 0 2h1v1a4 4 0 0 0 3.9.5l1.1-1.1A3 3 0 0 0 14.7 16L16.5 17.8H16A1 1 0 0 0 16 20h2a1 1 0 0 0 0-2h-.5l1.8-1.8A3 3 0 0 0 20 15.4z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg style={IconStyle(18)} viewBox="0 0 24 24" aria-hidden>
      <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1l-5 5 5 5V6c2.76 0 5 2.24 5 5a5 5 0 0 1-9.9 1H5.07A8 8 0 0 0 17.65 6.35z" />
    </svg>
  );
}

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
          <DumbbellIcon /> Today's Past Workouts
        </h3>
        <button onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshIcon />
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
          <DumbbellIcon /> Today's Past Workouts
        </h3>
        <button onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshIcon />
        </button>
        <p>No exercises recorded today.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3>
          <DumbbellIcon /> Today's Past Workouts
        </h3>
        <button onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshIcon />
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
