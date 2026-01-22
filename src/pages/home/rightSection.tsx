import { useActivePlanStore } from "../../states/activeplan";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
export default function RightSection() {

    const planId = useActivePlanStore((s) => s.id);
    const planName = useActivePlanStore((s) => s.name);
    console.log("Active Plan ID in RightSection:", planId);

    return (
        <div className="bg-card text-foreground rounded-xl shadow-md p-6 flex flex-col items-center gap-4 border border-border mt-6">
            <h1 className="text-xl font-semibold mb-2 text-center">
                {planName ? (
                    <>
                        Start your workout plan: <span className="ml-2 font-bold text-accent dark:text-chart-2">{planName}</span>
                    </>
                ) : (
                    <>Start your workout plan: <span className="ml-2 font-bold text-muted-foreground">No active plan found</span></>
                )}
            </h1>
            <ResumeOrStartButton planId={planId} />
        </div>
    );
}

function ResumeOrStartButton({ planId }: { planId: string | null }) {
    const navigate = useNavigate();
    const [hasTodayWorkout, setHasTodayWorkout] = useState(false);

    function getTodayISTKey() {
        return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    }

    useEffect(() => {
        if (!planId) {
            setHasTodayWorkout(false);
            return;
        }

        let mounted = true;

        const checkToday = async () => {
            const { data, error } = await supabase
                .from("workout_day")
                .select("created_at")
                .eq("plan_id", planId)
                .order("created_at", { ascending: false })
                .limit(1);

            if (error || !data) {
                if (mounted) setHasTodayWorkout(false);
                return;
            }

            const latest = data[0];
            const todayKey = getTodayISTKey();
            const latestKey = latest ? new Date(latest.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : null;

            if (mounted) setHasTodayWorkout(!!latestKey && latestKey === todayKey);
        };

        checkToday();

        return () => { mounted = false; };
    }, [planId]);

    const handleClick = () => {
        if (!planId) {
            alert("No active plan found. Please select a workout plan first.");
            return;
        }
        navigate("/workout");
    };

    return (
        <button
            className="btn bg-accent text-accent-foreground dark:bg-chart-2 dark:text-card px-6 py-2 rounded-lg font-bold shadow hover:bg-accent/90 dark:hover:bg-chart-2/90 transition-colors"
            onClick={handleClick}
        >
            {hasTodayWorkout ? "Resume Workout" : "Start Workout"}
        </button>
    );
}