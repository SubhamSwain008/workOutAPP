import { supabase } from "../../lib/supabase";
import Navbar from "../../components/navbar/navbar";
import { useActivePlanStore } from "../../states/activeplan";
import type { WorkoutDay } from "./types";
import SearchControls from "./SearchControls";
import DateFilter from "./DateFilter";
import HistoryTable from "./HistoryTable";
import Pagination from "./Pagination";
import Calendar from "../../components/calendar/Calendar";
import { useEffect, useState } from "react";
import { Clock, Calendar as CalendarIcon, Loader2, AlertCircle, Activity } from "lucide-react";
import { getDayTypes, formatDayType } from "../../lib/formatDayType";

function TabsContainer({
    CalendarComponent,
    LogComponent,
}: {
    CalendarComponent: React.ReactNode;
    LogComponent: React.ReactNode;
}) {
    const [tab, setTab] = useState<"calendar" | "log">("calendar");

    return (
        <div className="space-y-4">
            <div className="flex gap-2 border-b border-border/50">
                <button
                    onClick={() => setTab("calendar")}
                    className={`
                        px-4 py-2.5 text-sm font-semibold transition-all duration-200 relative
                        ${tab === "calendar"
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }
                    `}
                >
                    <span className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Calendar
                    </span>
                    {tab === "calendar" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setTab("log")}
                    className={`
                        px-4 py-2.5 text-sm font-semibold transition-all duration-200 relative
                        ${tab === "log"
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }
                    `}
                >
                    <span className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Workout Log
                    </span>
                    {tab === "log" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                </button>
            </div>

            <div className="animate-[workout-fade-in_0.3s_ease-out_both]">
                {tab === "calendar" ? CalendarComponent : LogComponent}
            </div>
        </div>
    );
}

export default function WorkoutHistory() {
    const activePlanId = useActivePlanStore((s) => s.id);

    const [data, setData] = useState<WorkoutDay[]>([]);
    const [allData, setAllData] = useState<WorkoutDay[]>([]); // Store all fetched data for client-side filtering
    const [search, setSearch] = useState("");
    const [searchMode, setSearchMode] = useState<"exercise" | "day">("exercise");
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [dateFilter, setDateFilter] = useState<"1m" | "3m" | "all" | "manual">("3m");
    const [manualStart, setManualStart] = useState("");
    const [manualEnd, setManualEnd] = useState("");

    useEffect(() => {
        if (!activePlanId) {
            setData([]);
            setAllData([]);
            setTotalCount(0);
            return;
        }

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);

            try {
                // Build date filter
                let startISO: string | null = null;
                let endISO: string | null = null;
                const now = new Date();
                
                if (dateFilter === "1m") {
                    const d = new Date(now);
                    d.setMonth(d.getMonth() - 1);
                    startISO = d.toISOString();
                    endISO = now.toISOString();
                } else if (dateFilter === "3m") {
                    const d = new Date(now);
                    d.setMonth(d.getMonth() - 3);
                    startISO = d.toISOString();
                    endISO = now.toISOString();
                } else if (dateFilter === "manual") {
                    if (manualStart) startISO = new Date(manualStart + "T00:00:00.000Z").toISOString();
                    if (manualEnd) endISO = new Date(manualEnd + "T23:59:59.999Z").toISOString();
                }

                // Build base query - fetch all matching workout days with exercises
                let baseQuery = supabase
                    .from("workout_day")
                    .select(
                        `
                        id,
                        created_at,
                        day_type_name,
                        day_index,
                        exercise (
                            id,
                            name,
                            set_number,
                            number_of_reps,
                            weight,
                            is_body_weighted,
                            targated_muscles
                        )
                        `,
                        { count: "exact" }
                    )
                    .eq("plan_id", activePlanId)
                    .order("created_at", { ascending: false });

                // Apply date filters
                if (startISO) baseQuery = baseQuery.gte("created_at", startISO);
                if (endISO) baseQuery = baseQuery.lte("created_at", endISO);

                const res = await baseQuery;

                if (res.error) {
                    console.error("Error fetching workout history:", res.error);
                    setError(res.error.message || "Failed to load workout history");
                    setAllData([]);
                    setData([]);
                    setTotalCount(0);
                    setLoading(false);
                    return;
                }

                let filteredData: WorkoutDay[] = (res.data || []) as WorkoutDay[];

                // Client-side filtering for day search (day_type_name is now text[])
                if (search && searchMode === "day") {
                    filteredData = filteredData.filter(day => {
                        const dayTypes = getDayTypes(day.day_type_name);
                        return dayTypes.some(t => t.toLowerCase().includes(search.toLowerCase()));
                    });
                }

                // Client-side filtering for exercise search (since we can't filter nested relations directly)
                if (search && searchMode === "exercise") {
                    filteredData = filteredData
                        .map(day => ({
                            ...day,
                            exercise: day.exercise.filter(ex => 
                                ex.name.toLowerCase().includes(search.toLowerCase())
                            )
                        }))
                        .filter(day => day.exercise.length > 0); // Only keep days that have matching exercises
                }

                setAllData(filteredData);
                setTotalCount(filteredData.length);

                // Apply pagination
                const paginatedData = filteredData.slice(
                    page * rowsPerPage,
                    page * rowsPerPage + rowsPerPage
                );
                setData(paginatedData);

            } catch (err) {
                console.error("Unexpected error:", err);
                setError("An unexpected error occurred");
                setAllData([]);
                setData([]);
                setTotalCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [activePlanId, page, search, searchMode, dateFilter, manualStart, manualEnd, rowsPerPage]);

    // Reset to page 0 when search or filters change
    useEffect(() => {
        setPage(0);
    }, [search, searchMode, dateFilter, manualStart, manualEnd, rowsPerPage]);

    const exportCsv = () => {
        const rows: string[] = [];
        rows.push(["Date", "Day Type", "Day Index", "Exercise", "Set", "Reps", "Weight", "Muscles"].join(","));
        allData.forEach((day) => {
            day.exercise.forEach((ex) => {
                rows.push([
                    new Date(day.created_at).toLocaleDateString(),
                    formatDayType(day.day_type_name),
                    String(day.day_index || ""),
                    ex.name,
                    String(ex.set_number),
                    String(ex.number_of_reps),
                    ex.is_body_weighted ? "Bodyweight" : `${ex.weight} kg`,
                    Array.isArray(ex.targated_muscles) ? ex.targated_muscles.join("; ") : "",
                ].join(","));
            });
        });
        const blob = new Blob([rows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `workout_history_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalPages = Math.ceil(totalCount / rowsPerPage);

    return (
        <div className="min-h-dvh bg-background text-foreground pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-[max(2rem,env(safe-area-inset-bottom))]">
            <Navbar />

            <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Header */}
                <div className="mb-4 sm:mb-6 animate-[workout-slide-up_0.4s_ease-out_both]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                            <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-primary" strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Workout History</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                Track your progress and review past sessions
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-card rounded-2xl sm:rounded-3xl shadow-lg border border-border overflow-hidden animate-[workout-scale-in_0.4s_ease-out_0.1s_both]">
                    {/* Search and Controls */}
                    <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/20">
                        <SearchControls
                            search={search}
                            setSearch={setSearch}
                            searchMode={searchMode}
                            setSearchMode={setSearchMode}
                            rowsPerPage={rowsPerPage}
                            setRowsPerPage={setRowsPerPage}
                            onExport={exportCsv}
                            setPage={setPage}
                            showExtras={true}
                        />
                    </div>

                    {/* Content Area */}
                    <div className="p-4 sm:p-6">
                        {/* Tabs: Calendar / Workout Log */}
                        <TabsContainer
                            CalendarComponent={<Calendar />}
                            LogComponent={
                                <div className="space-y-3">
                                    <DateFilter
                                        dateFilter={dateFilter}
                                        setDateFilter={setDateFilter}
                                        manualStart={manualStart}
                                        setManualStart={setManualStart}
                                        manualEnd={manualEnd}
                                        setManualEnd={setManualEnd}
                                        setPage={setPage}
                                    />

                                    {/* Compact Stats */}
                                    {!loading && allData.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span><span className="font-semibold text-foreground">{totalCount}</span> sessions</span>
                                            <span className="hidden sm:inline">·</span>
                                            <span><span className="font-semibold text-foreground">{allData.reduce((sum, day) => sum + day.exercise.length, 0)}</span> sets</span>
                                            <span className="hidden sm:inline">·</span>
                                            <span>{dateFilter === "all" ? "All time" : dateFilter === "1m" ? "Last month" : dateFilter === "3m" ? "Last 3 months" : "Custom"}</span>
                                            <span className="hidden sm:inline">·</span>
                                            <span>Page {page + 1}/{totalPages || 1}</span>
                                        </div>
                                    )}

                                    {/* Loading */}
                                    {loading && (
                                        <div className="flex items-center justify-center gap-2 py-8">
                                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            <span className="text-sm text-muted-foreground">Loading…</span>
                                        </div>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <div className="flex items-center gap-2 text-sm text-destructive py-4">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Empty */}
                                    {!loading && !error && data.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            {search
                                                ? "No results — try adjusting your search or date filters"
                                                : "No workouts logged yet"}
                                        </p>
                                    )}

                                    {/* History Table */}
                                    {!loading && !error && data.length > 0 && (
                                        <HistoryTable data={data} loading={loading} />
                                    )}

                                    {/* Pagination */}
                                    {!loading && !error && totalCount > 0 && (
                                        <Pagination page={page} setPage={setPage} totalPages={totalPages} />
                                    )}
                                </div>
                            }
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
