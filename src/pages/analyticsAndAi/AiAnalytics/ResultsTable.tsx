
import type { WorkoutDay } from "./types";

function formatDayType(val: unknown): string {
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed.startsWith("[")) {
            try { const parsed = JSON.parse(trimmed); if (Array.isArray(parsed)) return parsed.join(", "); } catch { /* ignore */ }
        }
        return trimmed;
    }
    return "Workout";
}

type Props = {
    data: WorkoutDay[];
    filteredData: WorkoutDay[];
    loading: boolean;
};

export default function ResultsTable({ data,  loading }: Props) {
    return (
        <>
            {loading && <p>Loading…</p>}
            {!loading && data.length === 0 && (
                <p className="text-muted-foreground">No workouts found.</p>
            )}

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
                                        <td className="px-3 py-2 text-foreground">{formatDayType(day.day_type_name)}</td>
                                        <td className="px-3 py-2 text-foreground">{ex.name}</td>
                                        <td className="px-3 py-2 text-right text-foreground">{ex.set_number}</td>
                                        <td className="px-3 py-2 text-right text-foreground">{ex.number_of_reps}</td>
                                        <td className="px-3 py-2 text-right text-foreground">{ex.is_body_weighted ? "Body Weight" : `${ex.weight} kg`}</td>
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
        </>
    );
}
