import { useEffect, useState, useRef, useCallback } from "react";
import {
  Search, Target, Minus, Plus, Weight, CheckCircle, Trash2, Dumbbell, X,
  Timer, Play,
} from "lucide-react";
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

/* ---------- Muscle group helper ---------- */
const MUSCLE_GROUPS = Array.from(
  new Set(TARGETED_MUSCLES.map((m) => m.group))
);

/* ---------- Rest Timer helpers ---------- */
const REST_RING_R = 22;
const REST_RING_C = 2 * Math.PI * REST_RING_R;

function formatRestTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

export default function AddSets() {
  const activePlanId = useActivePlanStore((s) => s.id);
  const setCurrentActiveWorkoutName = useCurretWorkoutStore((s) => s.setCurrentActiveWorkoutName);

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
  const [isDbUpdating, setIsDbUpdating] = useState(false);
  const [expandedMuscleGroup, setExpandedMuscleGroup] = useState<string | null>(null);

  /* ---------- Rest timer state ---------- */
  // restPeriods[i] = rest seconds between set i and set i+1 (index 0 = after set 1)
  const [restPeriods, setRestPeriods] = useState<number[]>([]);
  const [restElapsed, setRestElapsed] = useState(0);         // current rest seconds
  const [isResting, setIsResting] = useState(false);         // timer ticking
  const [isRestPaused, setIsRestPaused] = useState(false);   // user clicked "Start Set"
  const restStartRef = useRef<number>(0);                    // timestamp of last resume
  const restAccRef = useRef<number>(0);                      // accumulated ms before last pause
  const restIntervalRef = useRef<ReturnType<typeof setInterval>>(0 as any);

  const startRestTimer = useCallback(() => {
    clearInterval(restIntervalRef.current);
    restAccRef.current = 0;
    restStartRef.current = Date.now();
    setRestElapsed(0);
    setIsResting(true);
    setIsRestPaused(false);
    restIntervalRef.current = setInterval(() => {
      setRestElapsed(Math.floor((restAccRef.current + Date.now() - restStartRef.current) / 1000));
    }, 1000);
  }, []);

  // Called when user clicks "Start Set" — pauses the rest timer
  const pauseRestTimer = useCallback(() => {
    clearInterval(restIntervalRef.current);
    restAccRef.current += Date.now() - restStartRef.current;
    setRestElapsed(Math.floor(restAccRef.current / 1000));
    setIsResting(false);
    setIsRestPaused(true);
  }, []);

  // Called when the next set is logged — returns total rest seconds
  const stopRestTimer = useCallback(() => {
    clearInterval(restIntervalRef.current);
    const finalMs = isResting
      ? restAccRef.current + (Date.now() - restStartRef.current)
      : restAccRef.current;
    setIsResting(false);
    setIsRestPaused(false);
    setRestElapsed(0);
    restAccRef.current = 0;
    return Math.floor(finalMs / 1000);
  }, [isResting]);

  const resetRestTimer = useCallback(() => {
    clearInterval(restIntervalRef.current);
    setIsResting(false);
    setIsRestPaused(false);
    setRestElapsed(0);
    setRestPeriods([]);
    restAccRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(restIntervalRef.current), []);

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
      const todayWorkout = data?.find((w) => getISTKeyFromISOString(w.created_at) === today);
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
      const { data } = await supabase.rpc("get_exercise_name_suggestions", { search_text: exerciseName });
      if (data) setExerciseSuggestions(data.map((d: any) => d.name));
    })();
  }, [exerciseName, activeExercise]);

  /* ---------- muscle filtering ---------- */
  const filteredMuscles =
    muscleQuery.length < 2
      ? []
      : TARGETED_MUSCLES.filter(
          (m) => m.label.toLowerCase().includes(muscleQuery.toLowerCase()) && !selectedMuscles.includes(m.key)
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

    // Capture rest period if rest timer was running or paused (i.e. this is set 2+)
    if (isResting || isRestPaused) {
      const restSec = stopRestTimer();
      setRestPeriods((prev) => [...prev, restSec]);
    }

    setIsDbUpdating(true);
    const { data, error } = await supabase
      .from("exercise")
      .insert({
        workout_day_id: workoutDayId,
        name,
        set_number: sets.length + 1,
        number_of_reps: reps,
        weight: isBodyWeight ? 1 : weight,
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
      setIsDbUpdating(false);
      return;
    }

    setActiveExercise(name);
    const row = { ...(data as any), is_body_weighted: Boolean((data as any).is_body_weighted ?? (data as any).is_body_wieighted) } as ExerciseRow;
    setSets((p) => [...p, row]);
    setCurrentActiveWorkoutName(name);
    setIsDbUpdating(false);

    // Start rest timer for the next set
    startRestTimer();
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
    setIsDbUpdating(false);
    resetRestTimer();
  };

  /* ---------- delete set ---------- */
  const deleteSet = async (id: string | number, setNumber: number) => {
    if (!workoutDayId || !id) return;
    if (!confirm(`Delete set ${setNumber}? This cannot be undone.`)) return;
    setIsDbUpdating(true);
    const { error: delError } = await supabase.from("exercise").delete().eq("id", id);
    if (delError) {
      console.error("Delete set error:", delError);
      alert(delError.message ?? "Failed to delete set");
      setIsDbUpdating(false);
      return;
    }
    const { data: laterSets } = await supabase
      .from("exercise")
      .select("id, set_number")
      .eq("workout_day_id", workoutDayId)
      .gt("set_number", setNumber);
    if (laterSets && laterSets.length) {
      for (const row of laterSets) {
        try {
          await supabase.from("exercise").update({ set_number: (row as any).set_number - 1 }).eq("id", (row as any).id);
        } catch (e) {
          console.error("Failed renumbering set", row, e);
        }
      }
    }
    setSets((prev) => {
      const filtered = (prev as ExerciseRow[]).filter((s) => s.id !== id);
      return filtered.map((s) => (s.set_number > setNumber ? { ...s, set_number: s.set_number - 1 } : s));
    });
    setTimeout(() => setIsDbUpdating(false), 200);
  };

  /* ---------- Increment helpers ---------- */
  const adjustReps = (delta: number) => setReps((r) => Math.max(1, r + delta));
  const adjustWeight = (delta: number) => setWeight((w) => Math.max(0, w + delta));

  if (!workoutDayId) return null;

  /* ---------- Total volume ---------- */
  const totalVolume = sets.reduce(
    (acc, s) => acc + s.number_of_reps * (s.is_body_weighted ? 0 : s.weight),
    0
  );

  return (
    <div className="animate-[workout-fade-in_0.3s_ease-out_both]">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div className="absolute inset-0 bg-linear-to-b from-primary/3 to-transparent pointer-events-none" />

        <div className="relative">
          {/* ---- Active exercise header ---- */}
          {activeExercise ? (
            <div className="px-5 pt-5 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground leading-tight">{activeExercise}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sets.length} set{sets.length !== 1 ? "s" : ""}
                      {totalVolume > 0 && <> &middot; {totalVolume.toLocaleString()} kg volume</>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={finishExercise}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-chart-1/10
                             text-chart-1 text-xs font-semibold hover:bg-chart-1/20
                             transition-colors touch-manipulation active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Finish</span>
                </button>
              </div>
            </div>
          ) : (
            /* ---- New exercise setup ---- */
            <div className="px-5 pt-5 pb-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">New Exercise</h3>
              </div>

              {/* Exercise name input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <input
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  placeholder="Search or type exercise name..."
                  className="w-full h-12 rounded-xl border border-border bg-background pl-10 pr-4 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                             transition-all placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Autocomplete dropdown */}
              {exerciseSuggestions.length > 0 && (
                <div className="rounded-xl border border-border bg-popover shadow-lg overflow-hidden -mt-2 animate-[workout-fade-in_0.15s_ease-out_both]">
                  {exerciseSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setExerciseName(s); setExerciseSuggestions([]); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-primary/5
                                 border-b border-border/30 last:border-none
                                 transition-colors flex items-center gap-2"
                    >
                      <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Muscle target section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Muscles</span>
                </div>

                {/* Selected muscles */}
                {selectedMuscles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMuscles.map((k) => {
                      const muscle = TARGETED_MUSCLES.find((m) => m.key === k);
                      return (
                        <button
                          key={k}
                          onClick={() => setSelectedMuscles((p) => p.filter((x) => x !== k))}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                     bg-primary text-primary-foreground text-xs font-medium
                                     hover:bg-primary/80 transition-colors touch-manipulation active:scale-95"
                        >
                          {muscle?.label ?? k}
                          <X className="w-3 h-3" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Muscle search */}
                <input
                  placeholder="Search muscles..."
                  value={muscleQuery}
                  onChange={(e) => setMuscleQuery(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                             transition-all placeholder:text-muted-foreground/50"
                />

                {/* Search results */}
                {filteredMuscles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 animate-[workout-fade-in_0.15s_ease-out_both]">
                    {filteredMuscles.slice(0, 8).map((m) => (
                      <button
                        key={m.key}
                        onClick={() => { setSelectedMuscles((p) => [...p, m.key]); setMuscleQuery(""); }}
                        className="px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium
                                   hover:bg-accent/80 transition-colors touch-manipulation active:scale-95
                                   border border-transparent hover:border-primary/20"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick muscle group pills (when not searching) */}
                {muscleQuery.length < 2 && selectedMuscles.length === 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {MUSCLE_GROUPS.map((group) => (
                        <button
                          key={group}
                          onClick={() => setExpandedMuscleGroup(expandedMuscleGroup === group ? null : group)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-manipulation active:scale-95
                            ${expandedMuscleGroup === group
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50"
                            }`}
                        >
                          {group}
                        </button>
                      ))}
                    </div>

                    {expandedMuscleGroup && (
                      <div className="flex flex-wrap gap-1.5 animate-[workout-fade-in_0.15s_ease-out_both] pl-1">
                        {TARGETED_MUSCLES.filter((m) => m.group === expandedMuscleGroup && !selectedMuscles.includes(m.key)).map((m) => (
                          <button
                            key={m.key}
                            onClick={() => {
                              setSelectedMuscles((p) => [...p, m.key]);
                              setExpandedMuscleGroup(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-accent/60 text-accent-foreground text-xs
                                       hover:bg-accent transition-colors touch-manipulation active:scale-95"
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---- Rest timer banner (between sets) ---- */}
          {(isResting || isRestPaused) && sets.length > 0 && (
            <div className={`px-5 py-3 border-t border-border/30 animate-[workout-fade-in_0.3s_ease-out_both] ${
              isRestPaused ? "bg-primary/5" : "bg-chart-3/5"
            }`}>
              <div className="flex items-center justify-between gap-3">
                {/* Mini circular rest timer */}
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r={REST_RING_R} fill="none" strokeWidth="3.5" className="stroke-secondary" />
                      <circle
                        cx="28" cy="28" r={REST_RING_R} fill="none" strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray={REST_RING_C}
                        strokeDashoffset={REST_RING_C * (1 - (restElapsed % 60) / 60)}
                        className={`transition-[stroke-dashoffset] duration-1000 ${
                          isRestPaused ? "stroke-primary" : "stroke-chart-3"
                        }`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-mono font-bold tabular-nums ${
                        isRestPaused ? "text-primary" : "text-chart-3"
                      }`}>{formatRestTime(restElapsed)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${
                      isRestPaused ? "text-primary" : "text-chart-3"
                    }`}>
                      {isRestPaused ? "Set in progress" : "Resting"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {isRestPaused ? "Log the set when done" : "Ready? Tap Start Set"}
                    </span>
                  </div>
                </div>

                {/* Start Set button — pauses rest timer */}
                {isResting && (
                  <button
                    onClick={pauseRestTimer}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl
                               bg-chart-3 text-white text-xs font-bold
                               hover:opacity-90 active:scale-95 transition-all
                               touch-manipulation shadow-sm shadow-chart-3/30"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start Set
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ---- Set input row ---- */}
          <div className="px-5 py-4 bg-secondary/30 border-t border-border/50">
            <div className="flex flex-wrap items-center gap-3">
              {/* Reps stepper */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Reps</span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => adjustReps(-1)}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center
                               hover:bg-secondary/80 transition-colors touch-manipulation active:scale-90"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(Math.max(1, +e.target.value))}
                    className="w-14 h-8 rounded-lg border border-border bg-background text-center text-sm font-bold
                               focus:outline-none focus:ring-2 focus:ring-primary/40
                               [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => adjustReps(1)}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center
                               hover:bg-secondary/80 transition-colors touch-manipulation active:scale-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Body-weight toggle */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Type</span>
                <button
                  onClick={() => setIsBodyWeight(!isBodyWeight)}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all touch-manipulation active:scale-95
                    flex items-center gap-1.5
                    ${isBodyWeight
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground border border-border/50"
                    }`}
                >
                  <Weight className="w-3.5 h-3.5" />
                  {isBodyWeight ? "BW" : "Weight"}
                </button>
              </div>

              {/* Weight stepper (if not bodyweight) */}
              {!isBodyWeight && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">kg</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => adjustWeight(-2.5)}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center
                                 hover:bg-secondary/80 transition-colors touch-manipulation active:scale-90"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Math.max(0, +e.target.value))}
                      className="w-16 h-8 rounded-lg border border-border bg-background text-center text-sm font-bold
                                 focus:outline-none focus:ring-2 focus:ring-primary/40
                                 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => adjustWeight(2.5)}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center
                                 hover:bg-secondary/80 transition-colors touch-manipulation active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Add button */}
              <div className="flex flex-col items-center gap-1 ml-auto">
                <span className="text-[10px] font-semibold text-transparent uppercase">_</span>
                <button
                  onClick={addSet}
                  disabled={isDbUpdating}
                  className="h-8 px-5 rounded-xl bg-linear-to-r from-primary to-primary/85 text-primary-foreground
                             text-sm font-bold shadow-md shadow-primary/20
                             hover:shadow-lg hover:shadow-primary/30
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all touch-manipulation active:scale-95
                             flex items-center gap-1.5"
                >
                  {isDbUpdating ? (
                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {sets.length ? `Set ${sets.length + 1}` : "Start"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ---- Live set list ---- */}
          {sets.length > 0 && (
            <div className="px-5 py-3 border-t border-border/30">
              <div className="space-y-1">
                {sets.map((s, i) => (
                  <div key={s.id}>
                    {/* Rest period indicator between sets */}
                    {i > 0 && restPeriods[i - 1] !== undefined && (
                      <div className="flex items-center gap-2 py-1 pl-10">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="flex items-center gap-1 text-[10px] text-chart-3 font-medium shrink-0">
                          <Timer className="w-3 h-3" />
                          {formatRestTime(restPeriods[i - 1])} rest
                        </span>
                        <div className="h-px flex-1 bg-border/50" />
                      </div>
                    )}
                    <div
                      className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2.5
                                 hover:bg-secondary/70 transition-colors group"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                          {s.set_number}
                        </span>
                        <div className="text-sm">
                          <span className="font-semibold text-foreground">{s.number_of_reps} reps</span>
                          <span className="text-muted-foreground mx-1.5">&times;</span>
                          <span className="font-medium text-foreground">
                            {s.is_body_weighted ? "bodyweight" : `${s.weight} kg`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSet(s.id, s.set_number)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10
                                   opacity-0 group-hover:opacity-100 transition-all touch-manipulation active:scale-90
                                   sm:opacity-60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
