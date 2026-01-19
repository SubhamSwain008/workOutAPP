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
        return <p>No volume load data available.</p>;
    }

    /* ---------- UI ---------- */

    return (
        <div>
            <section>
                <h2>Volume Load</h2>
                <label>
                    Exercise:
                    <select
                        value={selectedExercise}
                        onChange={(e) => setExerciseName(e.target.value)}
                    >
                        {exerciseNames.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </label>
                <div style={{ width: "100%", height: 380 }}>
                    <ResponsiveContainer>
                        <LineChart data={filteredData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="volume_load" name="Volume Load" stroke="#7c9cff" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>
            <aside>
                <h3>Max Weight</h3>
                {maxWeightEntry ? (
                    <div>
                        <div>
                            <strong>Exercise</strong>
                            <div>{selectedExercise}</div>
                        </div>
                        <div>
                            <strong>Max Weight</strong>
                            <div>{maxWeightEntry.max_weight}</div>
                        </div>
                        <div>
                            <strong>Date</strong>
                            <div>{maxWeightEntry.date}</div>
                        </div>
                    </div>
                ) : (
                    <p>No max-weight data available.</p>
                )}
            </aside>
        </div>
    );
}
