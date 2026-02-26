import type { WorkoutDay } from "./types";

function formatDayType(val: unknown): string {
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed.startsWith("[")) {
            try { const parsed = JSON.parse(trimmed); if (Array.isArray(parsed)) return parsed.join(", "); } catch { /* ignore */ }
        }
        return trimmed || "—";
    }
    return "—";
}

type Props = {
    data: WorkoutDay[];
    loading: boolean;
};

export default function HistoryTable({ data }: Props) {
    // Flatten all exercises into rows with their parent day info
    const rows = data.flatMap(day =>
        day.exercise
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name) || a.set_number - b.set_number)
            .map(ex => ({
                dayId: day.id,
                date: new Date(day.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }),
                dayType: formatDayType(day.day_type_name),
                dayIndex: day.day_index ?? "",
                exercise: ex.name,
                set: ex.set_number,
                reps: ex.number_of_reps,
                weight: ex.is_body_weighted ? "BW" : `${ex.weight}`,
                id: ex.id,
            }))
    );

    return (
        <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-muted/60 text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="px-3 py-2 text-left font-semibold">Date</th>
                        <th className="px-3 py-2 text-left font-semibold">Day</th>
                        <th className="px-3 py-2 text-left font-semibold">Exercise</th>
                        <th className="px-3 py-2 text-right font-semibold">Set</th>
                        <th className="px-3 py-2 text-right font-semibold">Reps</th>
                        <th className="px-3 py-2 text-right font-semibold">Kg</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                    {rows.map((r) => (
                        <tr
                            key={r.id}
                            className="hover:bg-muted/30 transition-colors"
                        >
                            <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">{r.date}</td>
                            <td className="px-3 py-1.5 text-primary font-medium whitespace-nowrap">{r.dayType}</td>
                            <td className="px-3 py-1.5 text-foreground">{r.exercise}</td>
                            <td className="px-3 py-1.5 text-right text-muted-foreground">{r.set}</td>
                            <td className="px-3 py-1.5 text-right font-medium text-foreground">{r.reps}</td>
                            <td className="px-3 py-1.5 text-right font-medium text-foreground">{r.weight}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
