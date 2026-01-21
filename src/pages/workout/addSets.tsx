import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useActivePlanStore } from "../../states/activeplan";
import { useCurretWorkoutStore } from "../../states/curretActiveWorkout";
import type { ExerciseRow } from "../../models/exercise";
import { TARGETED_MUSCLES } from "./muscles_type";

/* ---------- IST helpers ---------- */
const getTodayISTKey = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const getISTKeyFromISOString = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export default function AddSets() {
  const activePlanId = useActivePlanStore((s) => s.id);
  const setCurrentActiveWorkoutName =
    useCurretWorkoutStore((s) => s.setCurrentActiveWorkoutName);

  const [workoutDayId, setWorkoutDayId] = useState<string | null>(null);

  const [exerciseName, setExerciseName] = useState("");
  const [exerciseSuggestions, setExerciseSuggestions] = useState<string[]>([]);

  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [isBodyWeight, setIsBodyWeight] = useState(false);

  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [sets, setSets] = useState<ExerciseRow[]>([]);

  const [muscleQuery, setMuscleQuery] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);

  /* ---------- fetch today's workout ---------- */
  useEffect(() => {
    if (!activePlanId) return;

    (async () => {
      const today = getTodayISTKey();
      const { data } = await supabase
        .from("workout_day")
        .select("id, created_at")
        .eq("plan_id", activePlanId)
        .order("created_at", { ascending: false });

      const todayWorkout = data?.find(
        (w) => getISTKeyFromISOString(w.created_at) === today
      );

      setWorkoutDayId(todayWorkout?.id ?? null);
    })();
  }, [activePlanId]);

  /* ---------- fetch active exercise ---------- */
  useEffect(() => {
    if (!workoutDayId) return;

    (async () => {
      const { data } = await supabase
        .from("exercise")
        .select("*")
        .eq("workout_day_id", workoutDayId)
        .eq("is_the_exercise_on", true)
        .order("set_number");

      if (data?.length) {
        // normalize possible DB typo field `is_body_wieighted`
        const normalized = data.map((r: any) => ({
          ...r,
          is_body_weighted: Boolean(r.is_body_weighted ?? r.is_body_wieighted),
        }));

        setActiveExercise(normalized[0].name);
        setSets(normalized as ExerciseRow[]);
        setSelectedMuscles(normalized[0].targated_muscles ?? []);
        setIsBodyWeight(Boolean(normalized[0].is_body_weighted));
        setCurrentActiveWorkoutName(normalized[0].name);
      } else {
        setActiveExercise(null);
        setSets([]);
        setSelectedMuscles([]);
        setIsBodyWeight(false);
        setCurrentActiveWorkoutName(null);
      }
    })();
  }, [workoutDayId, setCurrentActiveWorkoutName]);

  /* ---------- exercise suggestions ---------- */
  useEffect(() => {
    if (exerciseName.length < 2 || activeExercise) {
      setExerciseSuggestions([]);
      return;
    }

    (async () => {
      const { data } = await supabase.rpc(
        "get_exercise_name_suggestions",
        { search_text: exerciseName }
      );
      if (data) setExerciseSuggestions(data.map((d: any) => d.name));
    })();
  }, [exerciseName, activeExercise]);

  /* ---------- muscle filtering ---------- */
  const filteredMuscles =
    muscleQuery.length < 2
      ? []
      : TARGETED_MUSCLES.filter(
        (m) =>
          m.label.toLowerCase().includes(muscleQuery.toLowerCase()) &&
          !selectedMuscles.includes(m.key)
      );

  /* ---------- add set ---------- */
  const addSet = async () => {
    if (!workoutDayId) return;

    const name = activeExercise ?? exerciseName.trim();
    if (!name) return;

    if (!activeExercise && selectedMuscles.length === 0) {
      alert("Select at least one muscle");
      return;
    }

    const { data, error } = await supabase
      .from("exercise")
      .insert({
        workout_day_id: workoutDayId,
        name,
        set_number: sets.length + 1,
        number_of_reps: reps,
        weight: isBodyWeight ? 1 : weight,
        // include both correct and existing-typo column names so REST insert succeeds
        is_body_weighted: isBodyWeight,
        targated_muscles: selectedMuscles,
        is_the_exercise_on: true,
        is_the_exercise_done: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert exercise error:", error);
      alert(error.message ?? "Failed to add set");
      return;
    }

    setActiveExercise(name);
    // normalize returned row as well
    const row = { ...(data as any), is_body_weighted: Boolean((data as any).is_body_weighted ?? (data as any).is_body_wieighted) } as ExerciseRow;
    setSets((p) => [...p, row]);
    setCurrentActiveWorkoutName(name);
  };

  /* ---------- finish exercise ---------- */
  const finishExercise = async () => {
    if (!workoutDayId || !activeExercise) return;

    await supabase
      .from("exercise")
      .update({ is_the_exercise_on: false, is_the_exercise_done: true })
      .eq("workout_day_id", workoutDayId)
      .eq("name", activeExercise);

    setActiveExercise(null);
    setExerciseName("");
    setSets([]);
    setSelectedMuscles([]);
    setMuscleQuery("");
    setIsBodyWeight(false);
    setCurrentActiveWorkoutName(null);
  };

  if (!workoutDayId) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No workout started today.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg p-6 space-y-6">
      <h3 className="text-lg font-semibold text-center tracking-tight">
        Add Sets
      </h3>

      {!activeExercise && (
        <section className="space-y-3">
          <input
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder="Exercise name"
            className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
          />

          {exerciseSuggestions.length > 0 && (
            <div className="rounded-lg border border-border bg-popover shadow">
              {exerciseSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setExerciseName(s);
                    setExerciseSuggestions([]);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {!activeExercise && (
        <section className="space-y-3">
          <input
            placeholder="Search muscle (min 2 chars)"
            value={muscleQuery}
            onChange={(e) => setMuscleQuery(e.target.value)}
            className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
          />

          {filteredMuscles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filteredMuscles.slice(0, 6).map((m) => (
                <button
                  key={m.key}
                  onClick={() => {
                    setSelectedMuscles((p) => [...p, m.key]);
                    setMuscleQuery("");
                  }}
                  className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs"
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {selectedMuscles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMuscles.map((k) => (
                <span
                  key={k}
                  onClick={() =>
                    setSelectedMuscles((p) => p.filter((x) => x !== k))
                  }
                  className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs cursor-pointer"
                >
                  {k} ×
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {activeExercise && (
        <div className="text-center text-sm text-muted-foreground">
          Current exercise:{" "}
          <span className="font-medium text-foreground">{activeExercise}</span>
        </div>
      )}

      <section className="flex gap-3 flex-wrap">
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(+e.target.value)}
          className="w-24 h-10 rounded-lg border border-border px-3 text-sm"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isBodyWeight}
            onChange={(e) => setIsBodyWeight(e.target.checked)}
            className="checkbox checkbox-sm"
          />
          <span className="text-sm">Body-weight</span>
        </label>

        {!isBodyWeight && (
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(+e.target.value)}
            className="w-28 h-10 rounded-lg border border-border px-3 text-sm"
          />
        )}
        <button
          onClick={addSet}
          className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm"
        >
          {sets.length ? "Add set" : "Start"}
        </button>
      </section>

      {sets.length > 0 && (
        <section className="space-y-2">
          {sets.map((s) => (
            <div
              key={s.id}
              className="flex justify-between rounded-lg bg-secondary px-3 py-2 text-sm"
            >
              <span>Set {s.set_number}</span>
              <span>
                {s.number_of_reps} × {s.is_body_weighted ? "bodyweight" : `${s.weight} kg`}
              </span>
            </div>
          ))}
        </section>
      )}

      {activeExercise && (
        <button
          onClick={finishExercise}
          className="w-full h-11 rounded-lg border border-border text-sm hover:bg-muted"
        >
          Finish exercise
        </button>
      )}
    </div>
  );
}
