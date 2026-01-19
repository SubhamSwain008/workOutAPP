import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useActivePlanStore } from "../../states/activeplan";
import { useCurretWorkoutStore } from "../../states/curretActiveWorkout";
import type { ExerciseRow } from "../../models/exercise";
import { TARGETED_MUSCLES } from "./muscles_type";

/* ---------- IST helper ---------- */
function getTodayISTKey() {
    return new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
    });
}

function getISTKeyFromISOString(iso: string) {
    return new Date(iso).toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
    });
}

export default function AddSets() {
    const activePlanId = useActivePlanStore((s) => s.id);
    const setCurrentActiveWorkoutName =
        useCurretWorkoutStore((s) => s.setCurrentActiveWorkoutName);

    const [workoutDayId, setWorkoutDayId] = useState<string | null>(null);

    const [exerciseName, setExerciseName] = useState("");
    const [exerciseSuggestions, setExerciseSuggestions] = useState<string[]>([]);

    const [reps, setReps] = useState(10);
    const [weight, setWeight] = useState(0);

    const [activeExercise, setActiveExercise] = useState<string | null>(null);
    const [sets, setSets] = useState<ExerciseRow[]>([]);

 
    /* ---------- muscles ---------- */
    const [muscleQuery, setMuscleQuery] = useState("");
    const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);

    const filteredMuscles = TARGETED_MUSCLES.filter(
        (m) =>
            (m.label.toLowerCase().includes(muscleQuery.toLowerCase()) ||
                m.key.toLowerCase().includes(muscleQuery.toLowerCase())) &&
            !selectedMuscles.includes(m.key)
    );

    /* ---------- fetch today's workout_day ---------- */

    useEffect(() => {
        if (!activePlanId) return;

        (async () => {
            const todayIST = getTodayISTKey();

            const { data: allData } = await supabase
                .from("workout_day")
                .select("id, created_at")
                .eq("plan_id", activePlanId)
                .order("created_at", { ascending: false });

            // Find today's workout using IST comparison
            const todayWorkout = allData?.find(
                (w) => getISTKeyFromISOString(w.created_at) === todayIST
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

            if (data && data.length > 0) {
                setActiveExercise(data[0].name);
                setCurrentActiveWorkoutName(data[0].name);
                setSets(data);
                setSelectedMuscles(data[0].targated_muscles ?? []);
                // Fetch past history for the active exercise
                
            } else {
                setActiveExercise(null);
                setSets([]);
                setSelectedMuscles([]);
                setCurrentActiveWorkoutName(null);
                
            }
        })();
    }, [workoutDayId, setCurrentActiveWorkoutName]);

    /* ---------- DISTINCT exercise suggestions ---------- */

    useEffect(() => {
        if (exerciseName.length < 2 || activeExercise) {
            setExerciseSuggestions([]);
            return;
        }

        (async () => {
            const { data, error } = await supabase.rpc(
                "get_exercise_name_suggestions",
                { search_text: exerciseName }
            );

            if (!error && data) {
                setExerciseSuggestions(data.map((d: { name: string }) => d.name));
            }
        })();
    }, [exerciseName, activeExercise]);

    /* ---------- autofill muscles from last workout ---------- */

    const autofillMusclesFromLastWorkout = async (name: string) => {
        const { data } = await supabase
            .from("exercise")
            .select("targated_muscles")
            .eq("name", name)
            .eq("is_the_exercise_done", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data?.targated_muscles) {
            setSelectedMuscles(data.targated_muscles);
        }
    };

    /* ---------- add set ---------- */

    const addSet = async () => {
        if (!workoutDayId) return;

        const name = activeExercise ?? exerciseName.trim();
        if (!name) return;

        if (!activeExercise && selectedMuscles.length === 0) {
            alert("Select at least one targeted muscle");
            return;
        }

        const nextSetNumber = sets.length + 1;

        const { data, error } = await supabase
            .from("exercise")
            .insert({
                workout_day_id: workoutDayId,
                name,
                set_number: nextSetNumber,
                number_of_reps: reps,
                weight,
                targated_muscles: selectedMuscles,
                is_the_exercise_on: true,
                is_the_exercise_done: false
            })
            .select()
            .single();

        if (error) {
            console.error(error);
            return;
        }

        setActiveExercise(name);
        setSets((prev) => [...prev, data]);
        setCurrentActiveWorkoutName(name);
    };

    /* ---------- finish exercise ---------- */

    const finishExercise = async () => {
        if (!workoutDayId || !activeExercise) return;

        await supabase
            .from("exercise")
            .update({
                is_the_exercise_on: false,
                is_the_exercise_done: true
            })
            .eq("workout_day_id", workoutDayId)
            .eq("name", activeExercise);

        setActiveExercise(null);
        setExerciseName("");
        setSets([]);
        setSelectedMuscles([]);
        setMuscleQuery("");
        setCurrentActiveWorkoutName(null);
        
    };

    /* ---------------- UI ---------------- */

    if (!workoutDayId) {
        return <p>No workout started for today.</p>;
    }

    return (
        <div>
            <h3>Add Sets</h3>

            {/* ---------- Exercise selection ---------- */}
            {!activeExercise && (
                <fieldset>
                    <legend>Exercise</legend>

                    <input
                        value={exerciseName}
                        onChange={(e) => setExerciseName(e.target.value)}
                        placeholder="Exercise name"
                    />

                    {exerciseSuggestions.length > 0 && (
                        <ul>
                            {exerciseSuggestions.map((s) => (
                                <li
                                    key={s}
                                    onClick={async () => {
                                        setExerciseName(s);
                                        setExerciseSuggestions([]);
                                        await autofillMusclesFromLastWorkout(s);
                                       
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    {s}
                                </li>
                            ))}
                        </ul>
                    )}
                </fieldset>
            )}

            {/* ---------- Targeted muscles ---------- */}
            {!activeExercise && (
                <fieldset>
                    <legend>Targeted Muscles</legend>

                    <input
                        placeholder="Search muscle"
                        value={muscleQuery}
                        onChange={(e) => setMuscleQuery(e.target.value)}
                    />

                    {filteredMuscles.slice(0, 8).map((m) => (
                        <div
                            key={m.key}
                            onClick={() => {
                                setSelectedMuscles((prev) => [...prev, m.key]);
                                setMuscleQuery("");
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            {m.label} <small>({m.group}) - {m.key}</small>
                        </div>
                    ))}

                    {selectedMuscles.length > 0 && (
                        <div>
                            <strong>Selected:</strong>{" "}
                            {selectedMuscles.map((key) => {
                                const muscle = TARGETED_MUSCLES.find((m) => m.key === key);
                                return (
                                    <span
                                        key={key}
                                        onClick={() =>
                                            setSelectedMuscles((prev) =>
                                                prev.filter((x) => x !== key)
                                            )
                                        }
                                        style={{ marginLeft: 8, cursor: "pointer" }}
                                    >
                                        {muscle?.label ?? key} <small>({key})</small> ❌
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </fieldset>
            )}

            {/* ---------- Active exercise ---------- */}
            {activeExercise && (
                <div>
                    <strong>Current Exercise:</strong> {activeExercise}
                </div>
            )}

            {/* ---------- Set details ---------- */}
            <fieldset>
                <legend>Set Details</legend>

                <input
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(Number(e.target.value))}
                    placeholder="Reps"
                />

                <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    placeholder="Weight (kg)"
                />

                <button onClick={addSet}>
                    {sets.length === 0 ? "Start Exercise" : "Add Set"}
                </button>
            </fieldset>

            {/* ---------- Completed sets ---------- */}
            <fieldset>
                <legend>Completed Sets</legend>

                {sets.length === 0 && <p>No sets yet.</p>}

                {sets.map((s) => (
                    <div key={s.id}>
                        Set {s.set_number}: {s.number_of_reps} × {s.weight} kg{" "}
                        <small>
                            ({new Date(s.created_at).toLocaleTimeString()})
                        </small>
                    </div>
                ))}
            </fieldset>

            {/* ---------- Finish ---------- */}
            {activeExercise && (
                <button onClick={finishExercise}>
                    Finish Exercise
                </button>
            )}

        </div>
    );
}
