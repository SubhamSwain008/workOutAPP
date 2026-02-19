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

      // Fetch workout plan to get split_type array
      const { data: planData, error: planError } = await supabase
        .from("workout_plan")
        .select("split_type")
        .eq("id", activePlanId)
        .single();

      if (planError) {
        console.error(planError);
        setLoading(false);
        return;
      }

      // Fetch workout days
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

      // Use split_type array from the plan as day type options
      const splitTypes = Array.isArray(planData?.split_type) 
        ? planData.split_type 
        : [];

      setExistingDayTypes(splitTypes);
      setSelectedDayType(splitTypes[0] ?? "");

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
    <div className="bg-white dark:bg-card rounded-xl shadow-lg border border-border p-6 flex flex-col gap-6">
      <h3 className="text-xl font-bold text-primary mb-2 text-center">Today's Workout</h3>

      {/* ---- HISTORY ---- */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-base text-muted-foreground justify-center">
        <div>
          <span className="font-semibold text-foreground">Last:</span>{' '}
          {previousWorkout ? (
            <span className="font-medium text-primary">{previousWorkout.day_type_name}</span>
          ) : (
            <span className="italic">None</span>
          )}
        </div>
        <div>
          <span className="font-semibold text-foreground">Today:</span>{' '}
          {todayWorkout ? (
            <span className="font-medium text-primary">{todayWorkout.day_type_name}</span>
          ) : (
            <span className="italic">Not added</span>
          )}
        </div>
      </div>

      {/* ---- ADD ---- */}
      {canAddToday && (
        <div className="flex flex-col gap-4 mt-2 bg-secondary rounded-lg p-4 border border-border">
          <div className="flex gap-4 justify-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === "existing"}
                onChange={() => setMode("existing")}
                className="radio radio-primary"
              />
              <span className="text-sm font-medium">Select existing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === "new"}
                onChange={() => setMode("new")}
                className="radio radio-primary"
              />
              <span className="text-sm font-medium">Add new</span>
            </label>
          </div>

          {mode === "existing" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground mb-1">Day type</label>
              <select
                value={selectedDayType}
                onChange={(e) => setSelectedDayType(e.target.value)}
                className="select select-bordered w-full bg-white dark:bg-background text-foreground"
              >
                {existingDayTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "new" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground mb-1">New day type</label>
              <input
                placeholder="Push / Pull / Upper / Legs"
                value={newDayType}
                onChange={(e) => setNewDayType(e.target.value)}
                className="input input-bordered w-full bg-white dark:bg-background text-foreground"
              />
            </div>
          )}

          <button
            onClick={handleAddTodayWorkout}
            className="btn btn-primary w-full mt-2 text-base font-semibold py-2 rounded-lg shadow"
          >
            Add Today Workout
          </button>
        </div>
      )}

      {!canAddToday && (
        <div className="text-green-600 font-medium mt-2 text-center">You already logged today</div>
      )}
    </div>
  );
}
