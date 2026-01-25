import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useActivePlanStore } from "../../states/activeplan";
import { Token } from "../../auth/supabseToken/Token";
import type { WorkoutDay } from "./AiAnalyticts/types";
import { promptInstruction } from "./AiAnalyticts/responsePrompt";
const AI_ANALYTICS_URL = import.meta.env.VITE_BACKEND_URL;



export default function AiAnalytics() {
    const activePlanId = useActivePlanStore((s) => s.id);

    const [rawData, setRawData] = useState<WorkoutDay[]>([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [searchMode, setSearchMode] = useState<"exercise" | "day">("exercise");

    const [dateFilter, setDateFilter] =
        useState<"1m" | "3m" | "all" | "manual">("3m");
    const [manualStart, setManualStart] = useState("");
    const [manualEnd, setManualEnd] = useState("");

    const [userPrompt, setUserPrompt] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

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
        return filteredData;
    }, [filteredData]);

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
            setAiLoading(true);
            setAiResponse("Thinking…");
            const resp = await axios.post(
                `${AI_ANALYTICS_URL}/Ask-Ai`,
                { prompt: `${prompt}+ ${promptInstruction}` },
                {
                    headers: {
                        Authorization: `Bearer ${await Token()}`,
                    },
                }
            );
            setAiResponse(resp.data?.message ?? "No response from AI");
        } catch (err: any) {
            setAiResponse(err?.message ?? "AI request failed");
        } finally {
            setAiLoading(false);
        }
    };

    /* ---------------- UI ---------------- */

    return (
        <div className="min-h-screen bg-background text-foreground p-4">
            <div className="max-w-5xl mx-auto space-y-4">
                <header className="bg-card p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m4-4h.01M12 20h.01M6 8h.01M6 12h.01M6 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-primary">AI Analytics</h1>
                            <p className="text-sm text-muted-foreground">Filter by date → search → send exactly what you see to AI</p>
                        </div>
                    </div>
                </header>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="btn-group">
                        {["1m", "3m", "all", "manual"].map((v) => (
                            <button
                                key={v}
                                onClick={() => {
                                    setDateFilter(v as any);
                                }}
                                className={dateFilter === v ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
                            >
                                {v}
                            </button>
                        ))}
                    </div>

                    {dateFilter === "manual" && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={manualStart}
                                onChange={(e) => {
                                    setManualStart(e.target.value);
                                }}
                                className="input input-bordered input-sm"
                            />
                            <input
                                type="date"
                                value={manualEnd}
                                onChange={(e) => {
                                    setManualEnd(e.target.value);
                                }}
                                className="input input-bordered input-sm"
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 items-center w-full">
                    <div className="btn-group">
                        <button
                            onClick={() => { setSearchMode("exercise"); }}
                            className={searchMode === "exercise" ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
                        >
                            Exercise
                        </button>
                        <button
                            onClick={() => { setSearchMode("day"); }}
                            className={searchMode === "day" ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
                        >
                            Day
                        </button>
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative w-full">
                            <svg className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
                                <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth={2} fill="none" />
                            </svg>
                            <input
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); }}
                                placeholder={searchMode === "exercise" ? "Search exercise" : "Search day"}
                                className="input input-bordered input-sm pl-10 w-full"
                            />
                            {search && (
                                <button onClick={() => { setSearch(''); }} className="absolute right-2 top-2 btn btn-xs">X</button>
                            )}
                        </div>
                    </div>
                </div>

                {loading && <p>Loading…</p>}
                {!loading && data.length === 0 && (
                    <p className="text-muted-foreground">No workouts found.</p>
                )}

                {/* Stats + toolbar */}
                <div className="flex items-center justify-between gap-4 mt-3">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{filteredData.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); }}>
                            Export JSON
                        </button>
                    </div>
                </div>

                {data.length > 0 ? (
                    <div className="h-80 overflow-auto border border-border rounded-lg">
                        <table className="min-w-full table-auto">
                            <thead className="bg-card sticky top-0">
                                <tr className="text-sm text-muted-foreground">
                                    <th className="px-3 py-2 text-left">Date</th>
                                    <th className="px-3 py-2 text-left">Day</th>
                                    <th className="px-3 py-2 text-left">Exercise</th>
                                    <th className="px-3 py-2 text-right">Set</th>
                                    <th className="px-3 py-2 text-right">Reps</th>
                                    <th className="px-3 py-2 text-right">Weight</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((day) =>
                                    day.exercise.map((ex, idx) => (
                                        <tr
                                            key={`${day.id}-${ex.id}`}
                                            className={`hover:bg-secondary ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/5'}`}
                                        >
                                            <td className="px-3 py-2">{new Date(day.created_at).toLocaleDateString()}</td>
                                            <td className="px-3 py-2">{day.day_type_name || "Workout"}</td>
                                            <td className="px-3 py-2">{ex.name}</td>
                                            <td className="px-3 py-2 text-right">{ex.set_number}</td>
                                            <td className="px-3 py-2 text-right">{ex.number_of_reps}</td>
                                            <td className="px-3 py-2 text-right">{ex.is_body_weighted ? "BW" : `${ex.weight} kg`}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    !loading && (
                        <div className="p-6 text-center text-sm text-muted-foreground border border-border rounded-lg">
                            No workouts to show — try widening the date range or clearing the search.
                        </div>
                    )
                )}

                <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="input input-bordered w-full h-28"
                    placeholder="Ask the AI about the filtered workouts"
                />

                <div className="flex justify-end items-center gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={sendDisplayedToAI}
                            className="btn btn-primary"
                            disabled={aiLoading}
                        >
                            {aiLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z"></path>
                                    </svg>
                                    Thinking…
                                </>
                            ) : (
                                'Send to AI'
                            )}
                        </button>

                        <button onClick={() => { setAiResponse(''); }} className="btn btn-outline btn-sm">Clear</button>
                    </div>
                </div>

                {aiResponse && (
                    <div className="bg-muted p-3 rounded whitespace-pre-wrap mt-3">
                        <div className="flex items-start justify-between mb-2">
                            <div className="text-sm text-muted-foreground">AI response</div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(aiResponse);
                                        } catch (e) {
                                            console.error('copy failed', e);
                                        }
                                    }}
                                >
                                    Copy
                                </button>
                                <button className="btn btn-outline btn-sm" onClick={() => setAiResponse('')}>Close</button>
                            </div>
                        </div>
                        <pre className="text-sm">{aiResponse}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}
