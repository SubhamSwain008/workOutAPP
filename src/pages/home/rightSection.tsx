import { useActivePlanStore } from "../../states/activeplan";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Dumbbell, Calendar, Flame, TrendingUp, Clock, Target, Zap, Activity, PlayCircle } from "lucide-react";

export default function RightSection() {
    const planId = useActivePlanStore((s) => s.id);
    const planName = useActivePlanStore((s) => s.name);
    const splitType = useActivePlanStore((s) => s.split_type);
    const daysPerWeek = useActivePlanStore((s) => s.days_per_week);

    return (
        <div className="bg-card text-foreground rounded-2xl sm:rounded-3xl shadow-lg border border-border overflow-hidden animate-[workout-fade-in_0.4s_ease-out_both]">
            {/* Header with gradient */}
            <div className="bg-linear-to-r from-primary/20 via-primary/10 to-transparent px-4 sm:px-6 py-4 sm:py-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/20">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-lg sm:text-xl font-bold text-foreground">Ready to Train?</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Start or resume your workout session</p>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                {planName ? (
                    <div className="space-y-4">
                        {/* Plan Info Card */}
                        <div className="bg-linear-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-4 sm:p-5 border border-primary/20">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Dumbbell className="w-5 h-5 text-primary shrink-0" strokeWidth={2} />
                                        <h2 className="text-base sm:text-lg font-bold text-foreground truncate">{planName}</h2>
                                    </div>
                                    {Array.isArray(splitType) && splitType.length > 0 && (
                                        <p className="text-xs sm:text-sm text-muted-foreground ml-7">
                                            {splitType.join(' / ')}
                                        </p>
                                    )}
                                </div>
                                {daysPerWeek > 0 && (
                                    <div className="shrink-0 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-primary" />
                                            <span className="text-xs font-bold text-primary">{daysPerWeek}/week</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <ResumeOrStartButton planId={planId} />
                        </div>

                        {/* Stats Grid */}
                        <WorkoutStats planId={planId} />
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="p-4 rounded-xl bg-muted/50 inline-block mb-4">
                            <Target className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">No active plan found</p>
                        <p className="text-xs text-muted-foreground">Create a workout plan below to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ResumeOrStartButton({ planId }: { planId: string | null }) {
    const navigate = useNavigate();
    const [hasTodayWorkout, setHasTodayWorkout] = useState(false);
    const [loading, setLoading] = useState(true);

    function getTodayISTKey() {
        return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    }

    useEffect(() => {
        if (!planId) {
            setHasTodayWorkout(false);
            setLoading(false);
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
                if (mounted) {
                    setHasTodayWorkout(false);
                    setLoading(false);
                }
                return;
            }

            const latest = data[0];
            const todayKey = getTodayISTKey();
            const latestKey = latest ? new Date(latest.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : null;

            if (mounted) {
                setHasTodayWorkout(!!latestKey && latestKey === todayKey);
                setLoading(false);
            }
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

    if (loading) {
        return (
            <button
                className="w-full min-h-[48px] h-12 rounded-xl bg-primary/50 text-primary-foreground font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                disabled
            >
                <Activity className="w-5 h-5 animate-pulse" />
                <span>Loading...</span>
            </button>
        );
    }

    return (
        <button
            className="w-full min-h-[48px] h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm sm:text-base shadow-lg hover:shadow-xl hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation"
            onClick={handleClick}
        >
            {hasTodayWorkout ? (
                <>
                    <PlayCircle className="w-5 h-5" strokeWidth={2.5} />
                    <span>Resume Workout</span>
                </>
            ) : (
                <>
                    <Zap className="w-5 h-5" strokeWidth={2.5} />
                    <span>Start Workout</span>
                </>
            )}
        </button>
    );
}

function WorkoutStats({ planId }: { planId: string | null }) {
    const [stats, setStats] = useState({
        lastWorkoutDate: null as string | null,
        totalWorkouts: 0,
        workoutStreak: 0,
        thisWeekWorkouts: 0,
    });
    const [loading, setLoading] = useState(true);

    function getTodayISTKey() {
        return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    }

    // Convert "YYYY-MM-DD" → days since epoch (TZ-independent integer).
    function ymdToDayIdx(ymd: string): number {
        const [y, m, d] = ymd.split("-").map(Number);
        return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
    }

    // "Days ago" measured in IST calendar days, not raw 24h chunks.
    function getDaysAgo(dateString: string): number {
        const todayIdx = ymdToDayIdx(getTodayISTKey());
        const workoutIST = new Date(dateString).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        return todayIdx - ymdToDayIdx(workoutIST);
    }

    // UTC instant of Sunday 00:00 IST for the current IST week.
    function getWeekStartISTInstant(): number {
        const [y, m, d] = getTodayISTKey().split("-").map(Number);
        const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun
        // Sunday 00:00 IST = previous day 18:30 UTC
        return Date.UTC(y, m - 1, d - dow) - (5 * 60 + 30) * 60 * 1000;
    }

    useEffect(() => {
        if (!planId) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            const { data, error } = await supabase
                .from("workout_day")
                .select("created_at")
                .eq("plan_id", planId)
                .order("created_at", { ascending: false });

            if (error || !data) {
                setLoading(false);
                return;
            }

            const todayKey = getTodayISTKey();
            const weekStartInstant = getWeekStartISTInstant();

            // Last workout (not today)
            const lastWorkout = data.find(w => {
                const workoutDate = new Date(w.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
                return workoutDate !== todayKey;
            });

            // This week workouts (Sunday 00:00 IST onward)
            const thisWeekWorkouts = data.filter(w => {
                return new Date(w.created_at).getTime() >= weekStartInstant;
            }).length;

            // Calculate streak (consecutive days with workouts).
            // Use day indices (days since epoch) so diffs are exact and TZ/DST-safe.
            const toDayIdx = (ymd: string) => {
                const [y, m, d] = ymd.split("-").map(Number);
                return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
            };
            const todayIdx = toDayIdx(todayKey);
            const workoutIdxs = [...new Set(data.map(w =>
                new Date(w.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
            ))].map(toDayIdx).sort((a, b) => b - a);

            let streak = 0;
            if (workoutIdxs.length > 0) {
                const latest = workoutIdxs[0];
                // Allow yesterday so the streak doesn't break before the user trains today.
                if (latest === todayIdx || latest === todayIdx - 1) {
                    streak = 1;
                    let expected = latest - 1;
                    for (let i = 1; i < workoutIdxs.length; i++) {
                        if (workoutIdxs[i] === expected) {
                            streak++;
                            expected--;
                        } else if (workoutIdxs[i] < expected) {
                            break;
                        }
                    }
                }
            }

            setStats({
                lastWorkoutDate: lastWorkout?.created_at || null,
                totalWorkouts: data.length,
                workoutStreak: streak,
                thisWeekWorkouts,
            });
            setLoading(false);
        };

        fetchStats();
    }, [planId]);

    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
                ))}
            </div>
        );
    }

    const lastWorkoutDaysAgo = stats.lastWorkoutDate ? getDaysAgo(stats.lastWorkoutDate) : null;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Workouts */}
            <div className="bg-background/80 rounded-xl p-3 border border-border hover:border-primary/30 transition">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Total</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalWorkouts}</p>
                <p className="text-xs text-muted-foreground mt-0.5">workouts</p>
            </div>

            {/* Streak */}
            <div className="bg-background/80 rounded-xl p-3 border border-border hover:border-primary/30 transition">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-chart-3/20">
                        <Flame className="w-3.5 h-3.5 text-chart-3" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Streak</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.workoutStreak}</p>
                <p className="text-xs text-muted-foreground mt-0.5">days</p>
            </div>

            {/* This Week */}
            <div className="bg-background/80 rounded-xl p-3 border border-border hover:border-primary/30 transition">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-chart-1/20">
                        <TrendingUp className="w-3.5 h-3.5 text-chart-1" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">This Week</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.thisWeekWorkouts}</p>
                <p className="text-xs text-muted-foreground mt-0.5">sessions</p>
            </div>

            {/* Last Workout */}
            <div className="bg-background/80 rounded-xl p-3 border border-border hover:border-primary/30 transition">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-chart-4/20">
                        <Clock className="w-3.5 h-3.5 text-chart-4" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">Last</span>
                </div>
                {lastWorkoutDaysAgo !== null ? (
                    <>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{lastWorkoutDaysAgo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">days ago</p>
                    </>
                ) : (
                    <>
                        <p className="text-lg sm:text-xl font-bold text-muted-foreground">—</p>
                        <p className="text-xs text-muted-foreground mt-0.5">no data</p>
                    </>
                )}
            </div>
        </div>
    );
}
