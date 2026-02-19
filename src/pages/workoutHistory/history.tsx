import { supabase } from "../../lib/supabase";
import Navbar from "../../components/navbar/navbar";
import { useActivePlanStore } from "../../states/activeplan";
import type { WorkoutDay } from "./types";
import SearchControls from "./SearchControls";
import DateFilter from "./DateFilter";
import HistoryTable from "./HistoryTable";
import Pagination from "./Pagination";
import Calendar from "../../components/calendar/Calendar";

function TabsContainer({
    CalendarComponent,
    LogComponent,
}: {
    CalendarComponent: React.ReactNode;
    LogComponent: React.ReactNode;
}) {
    const [tab, setTab] = useState<"calendar" | "log">("calendar");

    return (
        <div>
            <div className="flex space-x-2 mb-3">
                <button
                    onClick={() => setTab("calendar")}
                    className={`px-3 py-1 rounded ${tab === "calendar" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}
                >
                    Calendar
                </button>
                <button
                    onClick={() => setTab("log")}
                    className={`px-3 py-1 rounded ${tab === "log" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}
                >
                    Workout Log
                </button>
            </div>

            <div>{tab === "calendar" ? CalendarComponent : LogComponent}</div>
        </div>
    );
}
import { useEffect, useState } from "react";

export default function WorkoutHistory() {
    const activePlanId = useActivePlanStore((s) => s.id);

    const [data, setData] = useState<WorkoutDay[]>([]);
    const [search, setSearch] = useState("");
    const [searchMode, setSearchMode] = useState<"exercise" | "day">("exercise");
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);

    const [rowsPerPage, setRowsPerPage] = useState(5);

    const [dateFilter, setDateFilter] = useState<"1m" | "3m" | "all" | "manual">("3m");
    const [manualStart, setManualStart] = useState("");
    const [manualEnd, setManualEnd] = useState("");

    useEffect(() => {
        if (!activePlanId) return;

        const fetchHistory = async () => {
            setLoading(true);

            const includeExerciseInner = searchMode === "exercise" && search;

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
                if (manualStart) startISO = new Date(manualStart).toISOString();
                if (manualEnd) endISO = new Date(manualEnd).toISOString();
            }

            let baseQuery = supabase
                .from("workout_day")
                .select(
                    `
          id,
          created_at,
          day_type_name,
          exercise${includeExerciseInner ? "!inner" : ""} (
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

            if (startISO) baseQuery = baseQuery.gte("created_at", startISO);
            if (endISO) baseQuery = baseQuery.lte("created_at", endISO);

            baseQuery = baseQuery.range(page * rowsPerPage, page * rowsPerPage + rowsPerPage - 1);

            let res: { data: any; error: any };

            if (!search) {
                res = await baseQuery;
            } else if (searchMode === "exercise") {
                res = await baseQuery.ilike("exercise.name", `%${search}%`);
            } else {
                res = await baseQuery.ilike("day_type_name", `%${search}%`);
            }

            if (!res.error && res.data) {
                setData(res.data as WorkoutDay[]);
            }

            setLoading(false);
        };

        fetchHistory();
    }, [activePlanId, page, search, searchMode, dateFilter, manualStart, manualEnd, rowsPerPage]);

    const exportCsv = () => {
        const rows: string[] = [];
        rows.push(["Date", "Day", "Exercise", "Set", "Reps", "Weight"].join(","));
        data.forEach((day) => {
            day.exercise.forEach((ex) => {
                rows.push([
                    new Date(day.created_at).toLocaleDateString(),
                    day.day_type_name || "Workout",
                    ex.name,
                    String(ex.set_number),
                    String(ex.number_of_reps),
                    ex.is_body_weighted ? "Bodyweight" : `${ex.weight} kg`,
                ].join(","));
            });
        });
        const blob = new Blob([rows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "workout_history.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-3xl mx-auto p-4">
                <div className="bg-card rounded-xl shadow-lg border border-border p-4 space-y-4">
                    <h1 className="text-xl font-bold text-primary">Workout History</h1>

                    <style>{`
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: var(--primary) transparent;
            }
            .custom-scrollbar::-webkit-scrollbar {
              width: 10px;
              height: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 999px; border: 2px solid rgba(0,0,0,0); background-clip: padding-box }
          `}</style>

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
                    {/* Tabs: Calendar / Workout Log */}
                    <TabsContainer
                        CalendarComponent={<Calendar />}
                        LogComponent={
                            <>
                                <DateFilter
                                    dateFilter={dateFilter}
                                    setDateFilter={setDateFilter}
                                    manualStart={manualStart}
                                    setManualStart={setManualStart}
                                    manualEnd={manualEnd}
                                    setManualEnd={setManualEnd}
                                    setPage={setPage}
                                />

                                {loading && <p>Loading…</p>}

                                {!loading && data.length === 0 && (
                                    <p className="text-muted-foreground">No workouts found.</p>
                                )}

                                {data.length > 0 && <HistoryTable data={data} loading={loading} />}

                                <Pagination page={page} setPage={setPage} />
                            </>
                        }
                    />
                </div>
            </main>
        </div>
    );
}
