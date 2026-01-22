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

/* ---------------- helper ---------------- */

// function formatTime(ts: string) {
//   return new Date(ts).toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

/* ---------------- icons ---------------- */

const IconStyle = (size = 16): React.CSSProperties => ({
  width: size,
  height: size,
  display: "inline-block",
  verticalAlign: "middle",
  fill: "currentColor", // inherit surrounding color (set via CSS variables like --primary / --muted-text)
});

function DumbbellIcon() {
  return (
    <svg style={IconStyle(18)} viewBox="0 0 24 24" aria-hidden>
      <path d="M20 8h-1.5l-2-2H17a1 1 0 0 0 0-2h-2a1 1 0 0 0 0 2h.5l-1.8 1.8A3 3 0 0 0 9 8.6L7.9 7.5A4 4 0 0 0 4 8v1H3a1 1 0 0 0 0 2h1v2H3a1 1 0 0 0 0 2h1v1a4 4 0 0 0 3.9.5l1.1-1.1A3 3 0 0 0 14.7 16L16.5 17.8H16A1 1 0 0 0 16 20h2a1 1 0 0 0 0-2h-.5l1.8-1.8A3 3 0 0 0 20 15.4L21.1 16.5A4 4 0 0 0 24 16v-1h1a1 1 0 0 0 0-2h-1V10h1a1 1 0 0 0 0-2h-1V8a4 4 0 0 0-3.9-.5L20 8z" />
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

function ClockIcon() {
  return (
    <svg style={IconStyle(14)} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 1a11 11 0 1 0 11 11A11.012 11.012 0 0 0 12 1zm.5 6H11v6l5.25 3.15.75-1.23L12.5 12z" />
    </svg>
  );
}

function WeightIcon() {
  return (
    <svg style={IconStyle(14)} viewBox="0 0 24 24" aria-hidden>
      <path d="M20 6h-3V4a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v2H4v2h1v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8h1zM9 4h6v2H9z" />
    </svg>
  );
}

function RepsIcon() {
  return (
    <svg style={IconStyle(14)} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1 14H9v-2h4v2zm2-4H7V8h8z" />
    </svg>
  );
}

/* ---------------- styles ---------------- */

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    maxWidth: 820,
    margin: "0 auto",
    color: "var(--text-color)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 18,
    fontWeight: 600,
    color: "var(--primary)",
  },
  card: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  exerciseCard: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 8,
    background: "var(--surface)",
    border: "1px solid var(--muted-border)",
  },
  exerciseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  muscles: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 8,
  },
  setsList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  setItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "8px",
    borderRadius: 6,
    background: "var(--item-bg)",
    border: "1px solid var(--muted-border)",
  },
  setLeft: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  metaGroup: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    fontSize: 13,
    color: "var(--muted-text)",
  },
  iconBtn: {
    background: "transparent",
    border: "1px solid var(--muted-border)",
    padding: 8,
    borderRadius: 8,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "var(--muted-text)",
  },
};

/* ---------------- component ---------------- */

export default function TodaysPastWorkouts() {
  const activePlanId = useActivePlanStore((s) => s.id);

  const [workoutDayId, setWorkoutDayId] = useState<string | null>(null);
  const [groupedExercises, setGroupedExercises] = useState<
    Record<string, ExerciseRow[]>
  >({});
  const [loading, setLoading] = useState(true);

  // 🔑 manual refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  /* ---------- fetch today's workout_day ---------- */

  useEffect(() => {
    if (!activePlanId) return;

    const fetchWorkoutDay = async () => {
      setLoading(true);
      const todayIST = getTodayISTKey();

      const { data, error } = await supabase
        .from("workout_day")
        .select("id, created_at")
        .eq("plan_id", activePlanId)
        .order("created_at", { ascending: false });

      if (error || !data) {
        setLoading(false);
        return;
      }

      const todayWorkout = data.find(
        (w) => getISTKeyFromISOString(w.created_at) === todayIST
      );

      setWorkoutDayId(todayWorkout?.id ?? null);
      setLoading(false);
    };

    fetchWorkoutDay();
  }, [activePlanId, refreshKey]);

  /* ---------- fetch exercises (reusable) ---------- */

  const fetchExercises = useCallback(async () => {
    if (!workoutDayId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("exercise")
      .select("*")
      .eq("workout_day_id", workoutDayId)
      .order("created_at", { ascending: true });

    if (error || !data) {
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

  /* ---------- run fetch on mount + refresh ---------- */

  useEffect(() => {
    if (!workoutDayId) return;
    fetchExercises();
  }, [workoutDayId, refreshKey, fetchExercises]);

  /* ---------------- UI ---------------- */

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading today's workouts...</p>;
  }

  if (!workoutDayId) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.title}>
              <DumbbellIcon />
              <span>Today's Past Workouts</span>
            </div>
            <button
              aria-label="Refresh workouts"
              onClick={() => setRefreshKey((k) => k + 1)}
              style={styles.iconBtn}
            >
              <RefreshIcon />
            </button>
          </div>
          <p>No workout logged today.</p>
        </div>
      </div>
    );
  }

  const exerciseNames = Object.keys(groupedExercises);

  if (exerciseNames.length === 0) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.title}>
              <DumbbellIcon />
              <span>Today's Past Workouts</span>
            </div>
            <button
              aria-label="Refresh workouts"
              onClick={() => setRefreshKey((k) => k + 1)}
              style={styles.iconBtn}
            >
              <RefreshIcon />
            </button>
          </div>
          <p>No exercises recorded today.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.cardHeader}>
        <div style={styles.title}>
          <DumbbellIcon />
          <span>Today's Past Workouts</span>
        </div>
        <button
          aria-label="Refresh workouts"
          onClick={() => setRefreshKey((k) => k + 1)}
          style={styles.iconBtn}
        >
          <RefreshIcon />
        </button>
      </div>

      {exerciseNames.map((exerciseName) => {
        const sets = groupedExercises[exerciseName];
        const muscles = sets[0]?.targated_muscles ?? [];

        return (
          <div key={exerciseName} style={styles.exerciseCard}>
            <div style={styles.exerciseHeader}>
              <div style={{ fontWeight: 600 }}>{exerciseName}</div>
              <div style={styles.metaGroup}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <RepsIcon /> {sets.length} set{sets.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {muscles.length > 0 && (
              <div style={styles.muscles}>Targeted muscles: {muscles.join(", ")}</div>
            )}

            <ul style={styles.setsList}>
              {sets.map((s) => {
                const isBodyWeight = Boolean((s as any).is_body_weighted ?? (s as any).is_body_wieighted);

                return (
                  <li key={s.id} style={styles.setItem}>
                    <div style={styles.setLeft}>
                      <div style={{ fontWeight: 600 }}>Set {s.set_number}</div>
                      <div style={styles.metaGroup}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <RepsIcon /> {s.number_of_reps}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <WeightIcon /> {isBodyWeight ? "bodyweight" : `${s.weight} kg`}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted-text)", fontSize: 13 }}>
                      <ClockIcon />
                      <span>{new Date(s.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
