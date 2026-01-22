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

  const exerciseNames = Array.from(
    new Set(volumeLoadData.map((d) => d.exerciseName))
  );

  const selectedExercise = exerciseName || exerciseNames[0] || "";

  const filteredData = volumeLoadData.filter(
    (d) => d.exerciseName === selectedExercise
  );

  const maxWeightEntry =
    selectedExercise === exerciseName && maxWeightData.length > 0
      ? maxWeightData[0]
      : null;

  if (!exerciseNames.length) {
    return (
      <p className="text-center text-sm text-muted-foreground py-6">
        No volume load data available.
      </p>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-3 py-4">
      <section className="bg-card border border-border rounded-xl p-4 space-y-4">
        {/* ---------- HEADER ---------- */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-primary">
            Volume Load
          </h2>

          {/* Mobile-friendly select */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Exercise</span>
            <select
              value={selectedExercise}
              onChange={(e) => setExerciseName(e.target.value)}
              className="
                h-11 px-3 rounded-lg
                border border-border
                bg-background
                text-foreground
                text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-ring
              "
            >
              {exerciseNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* ---------- CHART ---------- */}
        <div className="w-full h-64 sm:h-80 rounded-lg overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid
                stroke="var(--muted-border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted-text)", fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: "var(--muted-text)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--foreground)",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{
                  color: "var(--muted-text)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="volume_load"
                name="Volume Load"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ---------- MAX WEIGHT (STACKS BELOW ON MOBILE) ---------- */}
        <div
          className="
            rounded-lg
            border border-border
            bg-secondary
            p-4
            text-sm
            space-y-3
          "
        >
          <h3 className="font-semibold text-primary">
            Max Weight
          </h3>

          {maxWeightEntry ? (
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              <div className="text-muted-foreground">Exercise</div>
              <div className="font-medium">{selectedExercise}</div>

              <div className="text-muted-foreground">Max Weight</div>
              <div className="font-medium">
                {maxWeightEntry.max_weight}
              </div>

              <div className="text-muted-foreground">Date</div>
              <div className="font-medium">
                {maxWeightEntry.date}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No max-weight data available.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
