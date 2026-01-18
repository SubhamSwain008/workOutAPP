import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { WorkoutDay } from "../../models/workout_day";
import { useActivePlanStore } from "../../states/activeplan";
import { useAuthCheck } from "../../auth/authcheck/authcheck";
import { useCanStartWorkoutStore } from "../../states/canStartWorkout";

/* ---------- IST helpers ---------- */

function getISTDateKey(date: Date) {
  return date.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata"
  });
}

function getTodayISTKey() {
  return getISTDateKey(new Date());
}

function getISTKeyFromISOString(iso: string) {
  return getISTDateKey(new Date(iso));
}

/* ---------- Component ---------- */

export default function AddPresentDay() {
  useAuthCheck();

  const activePlanId = useActivePlanStore((s) => s.id);
  const setCanStartWorkout = useCanStartWorkoutStore(
    (s) => s.setCanStartWorkout
  );

  const [previousWorkout, setPreviousWorkout] =
    useState<WorkoutDay | null>(null);
  const [todayWorkout, setTodayWorkout] =
    useState<WorkoutDay | null>(null);

  const [canAddToday, setCanAddToday] = useState(true);
  const [loading, setLoading] = useState(true);

  /* ---- day type selection ---- */
  const [existingDayTypes, setExistingDayTypes] = useState<string[]>([]);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedDayType, setSelectedDayType] = useState("");
  const [newDayType, setNewDayType] = useState("");

  /* ---------- Fetch data ---------- */

  useEffect(() => {
    if (!activePlanId) return;

    const fetchData = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("workout_day")
        .select("*")
        .eq("plan_id", activePlanId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const todayIST = getTodayISTKey();

      const today = data?.find(
        (w) => getISTKeyFromISOString(w.created_at) === todayIST
      );

      const previous = data?.find(
        (w) => getISTKeyFromISOString(w.created_at) !== todayIST
      );

      setTodayWorkout(today ?? null);
      setPreviousWorkout(previous ?? null);

      const uniqueTypes = Array.from(
        new Set((data ?? []).map((d) => d.day_type_name))
      );

      setExistingDayTypes(uniqueTypes);
      setSelectedDayType(uniqueTypes[0] ?? "");

      setCanAddToday(!today);
      setCanStartWorkout(!!today);

      setLoading(false);
    };

    fetchData();
  }, [activePlanId, setCanStartWorkout]);

  /* ---------- Insert ---------- */

  const handleAddTodayWorkout = async () => {
    if (!canAddToday || !activePlanId) return;

    const dayType =
      mode === "existing" ? selectedDayType : newDayType.trim();

    if (!dayType) return;

    const newWorkout: WorkoutDay = {
      id: crypto.randomUUID(),
      plan_id: activePlanId,
      day_index: (previousWorkout?.day_index ?? 0) + 1,
      day_type_name: dayType,
      created_at: new Date().toISOString()
    } as WorkoutDay;

    const { error } = await supabase
      .from("workout_day")
      .insert(newWorkout);

    if (error) {
      console.error(error);
      return;
    }

    setTodayWorkout(newWorkout);
    setCanAddToday(false);
    setCanStartWorkout(true);
  };

  /* ---------- UI ---------- */

  if (loading) return null;

  return (
    <div>
      <h3>Today's Workout</h3>

      {/* ---- HISTORY ---- */}
      <div>
        <strong>Last Workout:</strong>{" "}
        {previousWorkout
          ? previousWorkout.day_type_name
          : "None"}
      </div>

      <div>
        <strong>Today:</strong>{" "}
        {todayWorkout ? todayWorkout.day_type_name : "Not added"}
      </div>

      {/* ---- ADD ---- */}
      {canAddToday && (
        <>
          <div>
            <label>
              <input
                type="radio"
                checked={mode === "existing"}
                onChange={() => setMode("existing")}
              />
              Select existing
            </label>

            <label>
              <input
                type="radio"
                checked={mode === "new"}
                onChange={() => setMode("new")}
              />
              Add new
            </label>
          </div>

          {mode === "existing" && (
            <select
              value={selectedDayType}
              onChange={(e) => setSelectedDayType(e.target.value)}
            >
              {existingDayTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )}

          {mode === "new" && (
            <input
              placeholder="Push / Pull / Upper / Legs"
              value={newDayType}
              onChange={(e) => setNewDayType(e.target.value)}
            />
          )}

          <button onClick={handleAddTodayWorkout}>
            Add Today Workout
          </button>
        </>
      )}

      {!canAddToday && (
        <div>You already logged today’s workout</div>
      )}
    </div>
  );
}
