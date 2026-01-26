import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useActivePlanStore } from "../../states/activeplan";
import { Token } from "../../auth/supabseToken/Token";
import type { WorkoutDay } from "./AiAnalyticts/types";
import { promptInstruction } from "./AiAnalyticts/responsePrompt";
import { Search, Activity, Loader2 } from "lucide-react";
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
                <header className="bg-card rounded-xl shadow-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                            <Activity className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-primary">AI Analytics</h1>
                            <p className="text-sm text-muted-foreground">Filter by date → search → send exactly what you see to AI</p>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Date:</span>
                        <div className="flex gap-2">
                            {["1m", "3m", "all", "manual"].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setDateFilter(v as any)}
                                    className={dateFilter === v ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
                                    title={v}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {dateFilter === "manual" && (
                        <div className="flex gap-2 items-center">
                            <input
                                type="date"
                                value={manualStart}
                                onChange={(e) => setManualStart(e.target.value)}
                                className="h-10 px-2 rounded border border-border bg-background text-sm"
                            />
                            <input
                                type="date"
                                value={manualEnd}
                                onChange={(e) => setManualEnd(e.target.value)}
                                className="h-10 px-2 rounded border border-border bg-background text-sm"
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 w-full sm:max-w-lg">
                        <div className="flex rounded-lg border border-border overflow-hidden bg-secondary">
                            <button
                                onClick={() => setSearchMode("exercise")}
                                aria-pressed={searchMode === "exercise"}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors ${searchMode === "exercise" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Exercise
                            </button>

                            <button
                                onClick={() => setSearchMode("day")}
                                aria-pressed={searchMode === "day"}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors ${searchMode === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Day
                            </button>
                        </div>

                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Search className="w-4 h-4" aria-hidden />
                            </span>

                            <input
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); }}
                                placeholder={searchMode === "exercise" ? "Search exercise" : "Search day"}
                                className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
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
                        <button
                            className="h-9 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition-colors"
                            onClick={() => { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); }}
                        >
                            Export JSON
                        </button>
                    </div>
                </div>

                {data.length > 0 ? (
                    <div className="h-80 overflow-auto border border-border rounded-lg custom-scrollbar">
                        <table className="min-w-full table-auto text-sm text-foreground">
                            <thead className="bg-card sticky top-0">
                                <tr className="text-sm text-muted-foreground">
                                    <th className="px-3 py-2 text-left border-b border-border">Date</th>
                                    <th className="px-3 py-2 text-left border-b border-border">Day</th>
                                    <th className="px-3 py-2 text-left border-b border-border">Exercise</th>
                                    <th className="px-3 py-2 text-right border-b border-border">Set</th>
                                    <th className="px-3 py-2 text-right border-b border-border">Reps</th>
                                    <th className="px-3 py-2 text-right border-b border-border">Weight</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((day) =>
                                    day.exercise.map((ex, idx) => (
                                        <tr
                                            key={`${day.id}-${ex.id}`}
                                            className={`hover:bg-secondary ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/5'} border-b border-border`}
                                        >
                                            <td className="px-3 py-2 text-foreground">{new Date(day.created_at).toLocaleDateString()}</td>
                                            <td className="px-3 py-2 text-foreground">{day.day_type_name || "Workout"}</td>
                                            <td className="px-3 py-2 text-foreground">{ex.name}</td>
                                            <td className="px-3 py-2 text-right text-foreground">{ex.set_number}</td>
                                            <td className="px-3 py-2 text-right text-foreground">{ex.number_of_reps}</td>
                                            <td className="px-3 py-2 text-right text-foreground">{ex.is_body_weighted ? "BW" : `${ex.weight} kg`}</td>
                                        </tr>
                                    )))}
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
                    className="w-full h-28 rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ask the AI about the filtered workouts"
                />

                <div className="flex justify-end items-center gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={sendDisplayedToAI}
                            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground flex items-center"
                            disabled={aiLoading}
                        >
                            {aiLoading ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    Thinking…
                                </>
                            ) : (
                                'Ask AI'
                            )}
                        </button>
                        <button onClick={() => { setAiResponse(''); }} className="h-9 px-3 rounded-lg border border-border text-sm">Clear</button>
                    </div>
                </div>

                {aiResponse && (
                    <div className="bg-card p-3 rounded-lg border border-border mt-3 whitespace-pre-wrap">
                        <div className="flex items-start justify-between mb-2">
                            <div className="text-sm text-muted-foreground">AI response</div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="h-9 px-3 rounded-lg text-sm"
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
                                <button className="h-9 px-3 rounded-lg border border-border text-sm" onClick={() => setAiResponse('')}>Close</button>
                            </div>
                        </div>
                        <pre className="text-sm">{aiResponse}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}
