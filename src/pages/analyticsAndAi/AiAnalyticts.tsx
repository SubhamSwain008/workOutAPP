import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useActivePlanStore } from "../../states/activeplan";
import { Token } from "../../auth/supabseToken/Token";
import type { WorkoutDay } from "./AiAnalytics/types";
import { promptInstruction } from "./AiAnalytics/responsePrompt";
import { Activity } from "lucide-react";
import DateFilter from "./AiAnalytics/DateFilter";
import SearchBar from "./AiAnalytics/SearchBar";
import ResultsTable from "./AiAnalytics/ResultsTable";
import AIControls from "./AiAnalytics/AIControls";
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

                <DateFilter
                    dateFilter={dateFilter}
                    setDateFilter={(v) => setDateFilter(v)}
                    manualStart={manualStart}
                    setManualStart={setManualStart}
                    manualEnd={manualEnd}
                    setManualEnd={setManualEnd}
                />

                <SearchBar
                    search={search}
                    setSearch={(s) => setSearch(s)}
                    searchMode={searchMode}
                    setSearchMode={(m) => setSearchMode(m)}
                />

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

                <ResultsTable data={data} filteredData={filteredData} loading={loading} />

                <AIControls
                    userPrompt={userPrompt}
                    setUserPrompt={(s) => setUserPrompt(s)}
                    sendDisplayedToAI={sendDisplayedToAI}
                    aiLoading={aiLoading}
                    aiResponse={aiResponse}
                    setAiResponse={(s) => setAiResponse(s)}
                />
            </div>
        </div>
    );
}
