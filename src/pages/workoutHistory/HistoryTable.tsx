import type { WorkoutDay } from "./types";

type Props = {
    data: WorkoutDay[];
    loading: boolean;
};

export default function HistoryTable({ data }: Props) {
    return (
        <div className="overflow-auto max-h-[60vh] border border-border rounded-lg bg-card p-2 custom-scrollbar">
            <table className="min-w-full table-auto divide-y divide-border">
                <thead className="sticky top-0 bg-card">
                    <tr>
                        <th className="text-left px-4 py-2 text-sm text-primary">Date</th>
                        <th className="text-left px-4 py-2 text-sm text-primary">Day</th>
                        <th className="text-left px-4 py-2 text-sm text-primary">Exercise</th>
                        <th className="text-left px-4 py-2 text-sm text-primary">Set</th>
                        <th className="text-left px-4 py-2 text-sm text-primary">Reps</th>
                        <th className="text-left px-4 py-2 text-sm text-primary">Weight</th>
                    </tr>
                </thead>
                <tbody className="bg-card">
                    {data.map((day) =>
                        day.exercise.map((ex) => (
                            <tr key={`${day.id}-${ex.id}`} className="hover:bg-secondary">
                                <td className="px-4 py-2 text-sm">{new Date(day.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-2 text-sm">{day.day_type_name || "Workout"}</td>
                                <td className="px-4 py-2 text-sm">{ex.name}</td>
                                <td className="px-4 py-2 text-sm">{ex.set_number}</td>
                                <td className="px-4 py-2 text-sm">{ex.number_of_reps}</td>
                                <td className="px-4 py-2 text-sm">{ex.is_body_weighted ? "Bodyweight" : `${ex.weight} kg`}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
