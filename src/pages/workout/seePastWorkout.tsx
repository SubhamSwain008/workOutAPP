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

/* ---------------- icons ---------------- */

const iconStyle = (size = 16): React.CSSProperties => ({
  width: size,
  height: size,
  display: "inline-block",
  verticalAlign: "middle",
  fill: "currentColor"
});

function CalendarIcon() {
  return (
    <svg style={iconStyle(16)} viewBox="0 0 24 24" aria-hidden>
      <path d="M7 10h5v5H7z" />
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 15H5V9h14z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg style={iconStyle(14)} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 1a11 11 0 1 0 11 11A11.012 11.012 0 0 0 12 1zm.5 6H11v6l5.25 3.15.75-1.23L12.5 12z" />
    </svg>
  );
}

function RepsIcon() {
  return (
    <svg style={iconStyle(14)} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1 14H9v-2h4v2zm2-4H7V8h8z" />
    </svg>
  );
}

function WeightIcon() {
  return (
    <svg style={iconStyle(14)} viewBox="0 0 24 24" aria-hidden>
      <path d="M20 6h-3V4a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v2H4v2h1v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8h1zM9 4h6v2H9z" />
    </svg>
  );
}

/* ---------------- styles ---------------- */

const styles: Record<string, React.CSSProperties> = {
  wrapper: { maxWidth: 820, margin: "0 auto", color: "var(--text-color)" },
  card: {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    justifyContent: "space-between",
  },
  title: { display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "var(--primary)" },
  sessions: { display: "grid", gap: 10 },
  sessionCard: {
    background: "var(--surface)",
    border: "1px solid var(--muted-border)",
    borderRadius: 8,
    padding: 10,
  },
  sessionDate: { display: "flex", alignItems: "center", gap: 8, fontWeight: 600, marginBottom: 8 },
  setList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 },
  setItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: "8px",
    borderRadius: 6,
    background: "var(--item-bg)",
    border: "1px solid var(--muted-border)",
  },
  setLeft: { display: "flex", gap: 12, alignItems: "center" },
  meta: { display: "flex", gap: 10, color: "var(--muted-text)", fontSize: 13, alignItems: "center" },
};

/* ---------------- component ---------------- */

export default function SeePastWorkout() {
  const workoutName = useCurretWorkoutStore((s) => s.currentActiveWorkoutName);
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
    return <p style={{ textAlign: "center" }}>No active workout selected.</p>;
  }

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading past workouts…</p>;
  }

  if (pastSessions.length === 0) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.title}>
              <CalendarIcon />
              <span>Past Workouts — {workoutName}</span>
            </div>
          </div>
          <p>No past workouts found for {workoutName}.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.title}>
            <CalendarIcon />
            <span>Past Workouts — {workoutName}</span>
          </div>
        </div>

        <div style={styles.sessions}>
          {pastSessions.map((session) => (
            <div key={session.workoutDayId} style={styles.sessionCard}>
              <div style={styles.sessionDate}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <CalendarIcon />
                  <span>{formatDate(session.date)}</span>
                </span>
                <span style={{ marginLeft: "auto", color: "var(--muted-text)", fontSize: 13 }}>
                  {session.sets.length} set{session.sets.length > 1 ? "s" : ""}
                </span>
              </div>

              <ul style={styles.setList}>
                {session.sets.map((s) => {
                  const isBodyWeight = Boolean((s as any).is_body_weighted ?? (s as any).is_body_wieighted);
                  return (
                    <li key={s.id} style={styles.setItem}>
                      <div style={styles.setLeft}>
                        <div style={{ fontWeight: 600 }}>Set {s.set_number}</div>
                        <div style={styles.meta}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <RepsIcon /> {s.number_of_reps}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <WeightIcon /> {isBodyWeight ? "bodyweight" : `${s.weight} kg`}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--muted-text)", fontSize: 13 }}>
                        <ClockIcon />
                        <span>{new Date(s.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
