import type { WorkoutDay } from "./types";
import { Calendar, Dumbbell, Target, TrendingUp } from "lucide-react";

type Props = {
    data: WorkoutDay[];
    loading: boolean;
};

export default function HistoryTable({ data }: Props) {
    // Group exercises by workout day for better display
    const groupedData = data.map(day => ({
        ...day,
        exerciseCount: day.exercise.length,
        totalSets: day.exercise.length,
        uniqueExercises: new Set(day.exercise.map(e => e.name)).size,
    }));

    return (
        <div className="space-y-3">
            {groupedData.map((day, dayIdx) => (
                <div
                    key={day.id}
                    className="bg-background/80 rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-all duration-200 animate-[workout-fade-in_0.3s_ease-out_both]"
                    style={{ animationDelay: `${dayIdx * 50}ms` }}
                >
                    {/* Day Header */}
                    <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 border-b border-border/50">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-primary/20">
                                    <Calendar className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-foreground">
                                            {new Date(day.created_at).toLocaleDateString("en-US", {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            })}
                                        </span>
                                        {day.day_index && (
                                            <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                                Day {day.day_index}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {day.day_type_name && (
                                            <span className="text-xs font-medium text-primary flex items-center gap-1">
                                                <Target className="w-3 h-3" />
                                                {day.day_type_name}
                                            </span>
                                        )}
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Dumbbell className="w-3 h-3" />
                                            {day.uniqueExercises} {day.uniqueExercises === 1 ? "exercise" : "exercises"}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            {day.totalSets} {day.totalSets === 1 ? "set" : "sets"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Exercises List */}
                    <div className="p-4">
                        <div className="space-y-3">
                            {Object.entries(
                                day.exercise.reduce<Record<string, typeof day.exercise>>((acc, ex) => {
                                    if (!acc[ex.name]) acc[ex.name] = [];
                                    acc[ex.name].push(ex);
                                    return acc;
                                }, {})
                            ).map(([exerciseName, sets]) => (
                                <div key={exerciseName} className="space-y-2">
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Dumbbell className="w-4 h-4 text-primary" />
                                        {exerciseName}
                                    </h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {sets
                                            .sort((a, b) => a.set_number - b.set_number)
                                            .map((set) => (
                                                <div
                                                    key={set.id}
                                                    className="bg-muted/50 rounded-lg p-2.5 border border-border/50"
                                                >
                                                    <div className="text-xs text-muted-foreground mb-1">Set {set.set_number}</div>
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {set.number_of_reps} reps
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {set.is_body_weighted ? (
                                                            <span className="text-chart-1">Bodyweight</span>
                                                        ) : (
                                                            `${set.weight} kg`
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
