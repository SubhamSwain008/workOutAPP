import { Activity, PlusCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/navbar/navbar";
import AddPresentDay from "./addPresentday";
import AddSets from "./addSets";
import TodaysPastWorkouts from "./TodaypastWorkouts";
import SeePastWorkout from "./seePastWorkout";
import Stopwatch from "./Stopwatch";

import { useCanStartWorkoutStore } from "../../states/canStartWorkout";
import { useActivePlanStore } from "../../states/activeplan";
import { useAuthCheck } from "../../auth/authcheck/authcheck";

export default function Workout() {
    useAuthCheck();

    const activePlanId = useActivePlanStore((s) => s.id);
    const activePlanName = useActivePlanStore((s) => s.name);
    const canStartWorkout = useCanStartWorkoutStore((s) => s.canStartWorkout);
    const navigate = useNavigate();

    const hasActivePlan = Boolean(activePlanId && activePlanId.trim() !== "");

    /* ---------- No Active Plan ---------- */
    if (!hasActivePlan) {
        return (
            <div className="min-h-dvh bg-background text-foreground overflow-x-hidden">
                <Navbar />
                <main className="px-4 sm:px-6 py-6 sm:py-10">
                    <div className="w-full max-w-xl mx-auto">
                        <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden animate-[workout-scale-in_0.4s_ease-out_both]">
                            <div className="p-8 sm:p-12 text-center">
                                <div className="flex justify-center mb-5">
                                    <div className="p-4 rounded-2xl bg-destructive/10">
                                        <AlertCircle className="w-12 h-12 text-destructive" strokeWidth={2} />
                                    </div>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                                    No Active Plan
                                </h1>
                                <p className="text-muted-foreground mb-8 text-sm sm:text-base max-w-sm mx-auto">
                                    Create and activate a workout plan to start tracking your sessions.
                                </p>
                                <button
                                    onClick={() => navigate("/home")}
                                    className="
                                        inline-flex items-center gap-2
                                        px-6 py-3.5 rounded-xl
                                        bg-primary text-primary-foreground
                                        text-sm font-bold
                                        hover:opacity-90 active:scale-[0.98]
                                        transition-all shadow-lg shadow-primary/20
                                        touch-manipulation
                                    "
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    Go to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-background text-foreground overflow-x-hidden">
            <Navbar />

            <main className="px-4 sm:px-6 py-4 sm:py-8 pb-8">
                <div className="w-full max-w-2xl mx-auto space-y-5">
                    {/* ---- Page header ---- */}
                    <header className="flex items-center justify-between animate-[workout-slide-up_0.4s_ease-out_both]">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">Workout</h1>
                                {activePlanName && (
                                    <p className="text-xs text-muted-foreground">{activePlanName}</p>
                                )}
                            </div>
                        </div>

                    </header>

                    {/* ---- Step 1: Start session / Status ---- */}
                    <section className="animate-[workout-slide-up_0.4s_ease-out_0.05s_both]">
                        <AddPresentDay />
                    </section>

                    {/* ---- Stopwatch (only when session is active) ---- */}
                    {canStartWorkout && (
                        <section className="animate-[workout-slide-up_0.4s_ease-out_0.07s_both]">
                            <Stopwatch />
                        </section>
                    )}

                    {/* ---- Step 2: Exercise tracker (only when session is active) ---- */}
                    {canStartWorkout && (
                        <section className="animate-[workout-slide-up_0.4s_ease-out_0.1s_both]">
                            <AddSets />
                        </section>
                    )}

                    {/* ---- Past performance for current exercise ---- */}
                    {canStartWorkout && (
                        <section className="animate-[workout-slide-up_0.4s_ease-out_0.15s_both]">
                            <SeePastWorkout />
                        </section>
                    )}

                    {/* ---- Today's completed exercises log ---- */}
                    {canStartWorkout && (
                        <section className="animate-[workout-slide-up_0.4s_ease-out_0.2s_both]">
                            <TodaysPastWorkouts />
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
