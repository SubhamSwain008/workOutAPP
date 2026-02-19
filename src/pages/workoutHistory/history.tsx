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
import { Clock, TrendingUp, Calendar as CalendarIcon, FileDown, Loader2, AlertCircle, Activity } from "lucide-react";

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
                            targeted_muscles
                        )
                        `,
                        { count: "exact" }
                    )
                    .eq("plan_id", activePlanId)
                    .order("created_at", { ascending: false });

                // Apply date filters
                if (startISO) baseQuery = baseQuery.gte("created_at", startISO);
                if (endISO) baseQuery = baseQuery.lte("created_at", endISO);

                // Filter by day_type_name if searching by day
                if (search && searchMode === "day") {
                    baseQuery = baseQuery.ilike("day_type_name", `%${search}%`);
                }

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
                    day.day_type_name || "Workout",
                    String(day.day_index || ""),
                    ex.name,
                    String(ex.set_number),
                    String(ex.number_of_reps),
                    ex.is_body_weighted ? "Bodyweight" : `${ex.weight} kg`,
                    Array.isArray(ex.targeted_muscles) ? ex.targeted_muscles.join("; ") : (ex.targeted_muscles || ""),
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
                                <div className="space-y-4">
                                    <DateFilter
                                        dateFilter={dateFilter}
                                        setDateFilter={setDateFilter}
                                        manualStart={manualStart}
                                        setManualStart={setManualStart}
                                        manualEnd={manualEnd}
                                        setManualEnd={setManualEnd}
                                        setPage={setPage}
                                    />

                                    {/* Stats Bar */}
                                    {!loading && allData.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-[workout-fade-in_0.3s_ease-out_0.2s_both]">
                                            <div className="bg-background/80 rounded-xl p-3 border border-border">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Activity className="w-4 h-4 text-primary" />
                                                    <span className="text-xs text-muted-foreground font-medium">Total Sessions</span>
                                                </div>
                                                <p className="text-xl font-bold text-foreground">{totalCount}</p>
                                            </div>
                                            <div className="bg-background/80 rounded-xl p-3 border border-border">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <TrendingUp className="w-4 h-4 text-chart-1" />
                                                    <span className="text-xs text-muted-foreground font-medium">Total Exercises</span>
                                                </div>
                                                <p className="text-xl font-bold text-foreground">
                                                    {allData.reduce((sum, day) => sum + day.exercise.length, 0)}
                                                </p>
                                            </div>
                                            <div className="bg-background/80 rounded-xl p-3 border border-border">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FileDown className="w-4 h-4 text-chart-4" />
                                                    <span className="text-xs text-muted-foreground font-medium">Date Range</span>
                                                </div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {dateFilter === "all" ? "All time" : dateFilter === "1m" ? "Last month" : dateFilter === "3m" ? "Last 3 months" : "Custom"}
                                                </p>
                                            </div>
                                            <div className="bg-background/80 rounded-xl p-3 border border-border">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CalendarIcon className="w-4 h-4 text-chart-3" />
                                                    <span className="text-xs text-muted-foreground font-medium">Page</span>
                                                </div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {page + 1} / {totalPages || 1}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Loading State */}
                                    {loading && (
                                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                                            <div className="p-4 rounded-xl bg-primary/10">
                                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            </div>
                                            <span className="text-sm text-muted-foreground">Loading workout history…</span>
                                        </div>
                                    )}

                                    {/* Error State */}
                                    {error && (
                                        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3 animate-[workout-shake_0.4s_ease-out_both]">
                                            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-destructive mb-1">Error loading history</p>
                                                <p className="text-xs text-muted-foreground">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty State */}
                                    {!loading && !error && data.length === 0 && (
                                        <div className="text-center py-12 animate-[workout-fade-in_0.3s_ease-out_both]">
                                            <div className="p-4 rounded-xl bg-muted/50 inline-block mb-4">
                                                <Activity className="w-12 h-12 text-muted-foreground opacity-50" />
                                            </div>
                                            <p className="text-base font-semibold text-foreground mb-1">No workouts found</p>
                                            <p className="text-sm text-muted-foreground">
                                                {search
                                                    ? "Try adjusting your search or date filters"
                                                    : "Start logging workouts to see your history here"}
                                            </p>
                                        </div>
                                    )}

                                    {/* History Table */}
                                    {!loading && !error && data.length > 0 && (
                                        <div className="animate-[workout-fade-in_0.3s_ease-out_0.2s_both]">
                                            <HistoryTable data={data} loading={loading} />
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {!loading && !error && totalCount > 0 && (
                                        <div className="animate-[workout-fade-in_0.3s_ease-out_0.3s_both]">
                                            <Pagination page={page} setPage={setPage} totalPages={totalPages} />
                                        </div>
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
