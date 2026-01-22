import { useVolumeLoadStore } from "./states/volume_load_store";
import { useMaxLoadStore } from "./states/maxweight";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

export default function PlotVolumeLoads() {
    const { volumeLoadData, exerciseName, setExerciseName } =
        useVolumeLoadStore();
    const { maxWeightData } = useMaxLoadStore();

    /* ---------- derive state ---------- */

    const exerciseNames = Array.from(
        new Set(volumeLoadData.map((d) => d.exerciseName))
    );

    const selectedExercise =
        exerciseName || exerciseNames[0] || "";

    const filteredData = volumeLoadData.filter(
        (d) => d.exerciseName === selectedExercise
    );

    const maxWeightEntry =
        selectedExercise === exerciseName && maxWeightData.length > 0
            ? maxWeightData[0]
            : null;

    /* ---------- early empty state ---------- */

    if (!exerciseNames.length) {
        return <p className="text-center text-sm text-muted-foreground">No volume load data available.</p>;
    }

    /* ---------- UI ---------- */

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <section className="bg-card border border-border rounded-lg p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Chart area */}
                    <div className="flex-1 min-h-[260px]">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-primary">Volume Load</h2>

                            <label className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">Exercise</span>
                                <select
                                    value={selectedExercise}
                                    onChange={(e) => setExerciseName(e.target.value)}
                                    className="px-2 py-1 rounded border border-border bg-transparent text-sm"
                                >
                                    {exerciseNames.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="w-full h-72 md:h-80 rounded">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={filteredData}>
                                    <CartesianGrid stroke="var(--muted-border)" strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fill: "var(--muted-text)" }} />
                                    <YAxis tick={{ fill: "var(--muted-text)" }} />
                                    <Tooltip wrapperStyle={{ background: "var(--card-bg)", borderRadius: 8, border: "1px solid var(--border)" }} />
                                    <Legend wrapperStyle={{ color: "var(--muted-text)" }} />
                                    <Line
                                        type="monotone"
                                        dataKey="volume_load"
                                        name="Volume Load"
                                        stroke="var(--primary)"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="w-full md:w-64 flex-shrink-0">
                        <div className="h-full rounded-md p-3" style={{ background: "var(--surface)", border: "1px solid var(--muted-border)" }}>
                            <h3 className="text-sm font-semibold text-primary mb-2">Max Weight</h3>

                            {maxWeightEntry ? (
                                <div className="flex flex-col gap-3 text-sm">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Exercise</div>
                                        <div className="font-medium">{selectedExercise}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Max Weight</div>
                                        <div className="font-medium">{maxWeightEntry.max_weight}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Date</div>
                                        <div className="font-medium">{maxWeightEntry.date}</div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No max-weight data available.</p>
                            )}
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}
