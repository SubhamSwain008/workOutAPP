import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useActivePlanStore } from "../../states/activeplan";

const AI_ANALYTICS_URL = import.meta.env.VITE_BACKEND_URL;

type ExerciseRow = {
    id: string;
    name: string;
    set_number: number;
    number_of_reps: number;
    weight: number;
    is_body_weighted: boolean;
};

type WorkoutDay = {
    id: string;
    created_at: string;
    day_type_name: string;
    exercise: ExerciseRow[];
};

export default function AiAnalytics() {
    const activePlanId = useActivePlanStore((s) => s.id);

    const [rawData, setRawData] = useState<WorkoutDay[]>([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [searchMode, setSearchMode] = useState<"exercise" | "day">("exercise");

    const [page, setPage] = useState(0);
    const rowsPerPage = 5;

    const [dateFilter, setDateFilter] =
        useState<"1m" | "3m" | "all" | "manual">("3m");
    const [manualStart, setManualStart] = useState("");
    const [manualEnd, setManualEnd] = useState("");

    const [userPrompt, setUserPrompt] = useState("");
    const [aiResponse, setAiResponse] = useState("");

    /* ---------------- FETCH (NO PAGINATION HERE) ---------------- */

    useEffect(() => {
        if (!activePlanId) return;

        const fetchHistory = async () => {
            setLoading(true);

            let startISO: string | null = null;
            let endISO: string | null = null;

            const now = new Date();

            if (dateFilter === "1m") {
                const d = new Date(now);
                d.setMonth(d.getMonth() - 1);
                startISO = d.toISOString();
                endISO = now.toISOString();
            }

            if (dateFilter === "3m") {
                const d = new Date(now);
                d.setMonth(d.getMonth() - 3);
                startISO = d.toISOString();
                endISO = now.toISOString();
            }

            if (dateFilter === "manual" && manualStart) {
                const start = new Date(manualStart + "T00:00:00.000Z");
                const end = manualEnd
                    ? new Date(manualEnd + "T23:59:59.999Z")
                    : new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

                startISO = start.toISOString();
                endISO = end.toISOString();
            }

            let q = supabase
                .from("workout_day")
                .select(
                    `
                    id,
                    created_at,
                    day_type_name,
                    exercise (
                        id,
                        name,
                        set_number,
                        number_of_reps,
                        weight,
                        is_body_weighted
                    )
                    `
                )
                .eq("plan_id", activePlanId)
                .order("created_at", { ascending: false });

            if (startISO) q = q.gte("created_at", startISO);
            if (endISO) q = q.lte("created_at", endISO);

            const { data, error } = await q;

            if (!error && data) setRawData(data as WorkoutDay[]);
            setLoading(false);
        };

        fetchHistory();
    }, [activePlanId, dateFilter, manualStart, manualEnd]);

    /* ---------------- FILTER + SEARCH (CLIENT SIDE) ---------------- */

    const filteredData = useMemo(() => {
        if (!search) return rawData;

        return rawData
            .map((day) => {
                if (searchMode === "day") {
                    return day.day_type_name
                        ?.toLowerCase()
                        .includes(search.toLowerCase())
                        ? day
                        : null;
                }

                const exercises = day.exercise.filter((ex) =>
                    ex.name.toLowerCase().includes(search.toLowerCase())
                );

                return exercises.length
                    ? { ...day, exercise: exercises }
                    : null;
            })
            .filter(Boolean) as WorkoutDay[];
    }, [rawData, search, searchMode]);

    /* ---------------- PAGINATION (CLIENT SIDE) ---------------- */

    const data = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, page]);

    /* ---------------- AI ---------------- */

    const sendDisplayedToAI = async () => {
        const rows: string[] = [];
        rows.push("Date,Day,Exercise,Set,Reps,Weight");

        data.forEach((day) => {
            day.exercise.forEach((ex) => {
                rows.push(
                    [
                        new Date(day.created_at).toLocaleDateString(),
                        day.day_type_name || "Workout",
                        ex.name,
                        ex.set_number,
                        ex.number_of_reps,
                        ex.is_body_weighted ? "Bodyweight" : `${ex.weight}kg`,
                    ].join(",")
                );
            });
        });

        const prompt = `
USER QUESTION:
${userPrompt || "Analyze the workout data below."}

WORKOUT DATA (CSV):
${rows.join("\n")}
`.trim();

        try {
            setAiResponse("Thinking…");
            const resp = await axios.post(`${AI_ANALYTICS_URL}/Ask-Ai`, { prompt });
            setAiResponse(resp.data?.message ?? "No response from AI");
        } catch (err: any) {
            setAiResponse(err?.message ?? "AI request failed");
        }
    };

    /* ---------------- UI ---------------- */

    return (
        <div className="min-h-screen bg-background text-foreground p-4">
            <div className="max-w-5xl mx-auto space-y-4">
                <header>
                    <h1 className="text-2xl font-bold text-primary">AI Analytics</h1>
                    <p className="text-sm text-muted-foreground">
                        Filter by date → search → send exactly what you see to AI
                    </p>
                </header>

                <div className="flex flex-wrap items-center gap-2">
                    {["1m", "3m", "all", "manual"].map((v) => (
                        <button
                            key={v}
                            onClick={() => {
                                setPage(0);
                                setDateFilter(v as any);
                            }}
                            className={
                                dateFilter === v
                                    ? "btn btn-primary btn-sm"
                                    : "btn btn-outline btn-sm"
                            }
                        >
                            {v}
                        </button>
                    ))}

                    {dateFilter === "manual" && (
                        <>
                            <input
                                type="date"
                                value={manualStart}
                                onChange={(e) => {
                                    setPage(0);
                                    setManualStart(e.target.value);
                                }}
                                className="input input-bordered input-sm"
                            />
                            <input
                                type="date"
                                value={manualEnd}
                                onChange={(e) => {
                                    setPage(0);
                                    setManualEnd(e.target.value);
                                }}
                                className="input input-bordered input-sm"
                            />
                        </>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => {
                            setPage(0);
                            setSearchMode("exercise");
                        }}
                        className={
                            searchMode === "exercise"
                                ? "btn btn-primary btn-sm"
                                : "btn btn-outline btn-sm"
                        }
                    >
                        Exercise
                    </button>
                    <button
                        onClick={() => {
                            setPage(0);
                            setSearchMode("day");
                        }}
                        className={
                            searchMode === "day"
                                ? "btn btn-primary btn-sm"
                                : "btn btn-outline btn-sm"
                        }
                    >
                        Day
                    </button>

                    <input
                        value={search}
                        onChange={(e) => {
                            setPage(0);
                            setSearch(e.target.value);
                        }}
                        placeholder={
                            searchMode === "exercise"
                                ? "Search exercise"
                                : "Search day"
                        }
                        className="input input-bordered input-sm flex-1"
                    />
                </div>

                {loading && <p>Loading…</p>}
                {!loading && data.length === 0 && (
                    <p className="text-muted-foreground">No workouts found.</p>
                )}

                {data.length > 0 && (
                    <div className="overflow-auto border border-border rounded-lg">
                        <table className="min-w-full table-auto">
                            <thead className="bg-card sticky top-0">
                                <tr>
                                    <th>Date</th>
                                    <th>Day</th>
                                    <th>Exercise</th>
                                    <th>Set</th>
                                    <th>Reps</th>
                                    <th>Weight</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((day) =>
                                    day.exercise.map((ex) => (
                                        <tr
                                            key={`${day.id}-${ex.id}`}
                                            className="hover:bg-secondary"
                                        >
                                            <td>{new Date(day.created_at).toLocaleDateString()}</td>
                                            <td>{day.day_type_name || "Workout"}</td>
                                            <td>{ex.name}</td>
                                            <td>{ex.set_number}</td>
                                            <td>{ex.number_of_reps}</td>
                                            <td>{ex.is_body_weighted ? "BW" : `${ex.weight} kg`}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="input input-bordered w-full h-28"
                    placeholder="Ask the AI about the filtered workouts"
                />

                <div className="flex justify-between items-center">
                    <button
                        disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)}
                        className="btn btn-outline btn-sm"
                    >
                        Previous
                    </button>

                    <button onClick={sendDisplayedToAI} className="btn btn-primary">
                        Send to AI
                    </button>

                    <button
                        disabled={(page + 1) * rowsPerPage >= filteredData.length}
                        onClick={() => setPage((p) => p + 1)}
                        className="btn btn-outline btn-sm"
                    >
                        Next
                    </button>
                </div>

                {aiResponse && (
                    <div className="bg-muted p-3 rounded whitespace-pre-wrap">
                        {aiResponse}
                    </div>
                )}
            </div>
        </div>
    );
}
