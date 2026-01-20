import { useActivePlanStore } from "../../states/activeplan";
import { useNavigate } from "react-router-dom";
export default function RightSection() {
    const navigate = useNavigate();
    const planId = useActivePlanStore((s) => s.id);
    const planName = useActivePlanStore((s) => s.name);
    console.log("Active Plan ID in RightSection:", planId);

    return (
        <div className="bg-card text-foreground rounded-xl shadow-md p-6 flex flex-col items-center gap-4 border border-border mt-6">
            <h1 className="text-xl font-semibold mb-2 text-center">
                Start your workout plan:
                {planName ? (
                    <span className="ml-2 font-bold text-accent dark:text-chart-2">{planName}</span>
                ) : (
                    <span className="ml-2 font-bold text-muted-foreground">No active plan found</span>
                )}
            </h1>
            <button
                className="btn bg-accent text-accent-foreground dark:bg-chart-2 dark:text-card px-6 py-2 rounded-lg font-bold shadow hover:bg-accent/90 dark:hover:bg-chart-2/90 transition-colors"
                onClick={() => navigate("/workout")}
                disabled={!planId}
            >
                Start Workout
            </button>
        </div>
    );
}