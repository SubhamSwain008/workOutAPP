import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight, Activity, Calendar, TrendingUp, PlusCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/navbar/navbar";
import AddPresentDay from "./addPresentday";
import LastDay from "./lastDay";
import AddSets from "./addSets";
import TodaysPastWorkouts from "./TodaypastWorkouts";
import SeePastWorkout from "./seePastWorkout";

import { useCanStartWorkoutStore } from "../../states/canStartWorkout";
import { useActivePlanStore } from "../../states/activeplan";
import { useAuthCheck } from "../../auth/authcheck/authcheck";

export default function Workout() {
    useAuthCheck();
    
    const activePlanId = useActivePlanStore((s) => s.id);
    const activePlanName = useActivePlanStore((s) => s.name);
    const canStartWorkout = useCanStartWorkoutStore((s) => s.canStartWorkout);
    const navigate = useNavigate();

    const sliderRef = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Only allow workout if there's an active plan
    const hasActivePlan = Boolean(activePlanId && activePlanId.trim() !== "");
    
    // Slides:
    // 0 → LastDay + AddPresentDay
    // 1 → TodaysPastWorkouts
    // 2 → AddSets + SeePastWorkout
    const slidesCount = hasActivePlan && canStartWorkout ? 3 : hasActivePlan ? 2 : 0;

    const slideLabels = [
        "Overview & Start",
        "Today's Progress",
        "Add Sets & History"
    ];

    /* ---------- keep index valid ---------- */
    useEffect(() => {
        if (slidesCount > 0) {
            setIndex((i) => Math.min(i, slidesCount - 1));
        } else {
            setIndex(0);
        }
    }, [slidesCount]);

    /* ---------- GSAP slide animation ---------- */
    useEffect(() => {
        if (!sliderRef.current) return;

        setIsAnimating(true);
        const percent = (index * 100) / slidesCount;

        gsap.to(sliderRef.current, {
            x: `-${percent}%`,
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: () => setIsAnimating(false),
        });
    }, [index, slidesCount]);

    const next = () => {
        if (isAnimating || index >= slidesCount - 1) return;
        setIndex((i) => Math.min(i + 1, slidesCount - 1));
    };

    const prev = () => {
        if (isAnimating || index === 0) return;
        setIndex((i) => Math.max(i - 1, 0));
    };

    // Touch/swipe support for mobile
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;

        const distance = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50;

        if (distance > minSwipeDistance && index < slidesCount - 1) {
            next();
        } else if (distance < -minSwipeDistance && index > 0) {
            prev();
        }

        touchStartX.current = null;
        touchEndX.current = null;
    };

    // Show "No Active Plan" message if no plan exists
    if (!hasActivePlan) {
        return (
            <div className="min-h-dvh bg-background text-foreground overflow-x-hidden">
                <Navbar />
                <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-[env(safe-area-inset-bottom)]">
                    <div className="w-full max-w-4xl mx-auto">
                        <div className="bg-card rounded-2xl sm:rounded-3xl shadow-lg border border-border overflow-hidden animate-[workout-scale-in_0.4s_ease-out_both]">
                            <div className="p-6 sm:p-8 md:p-12 text-center">
                                <div className="flex justify-center mb-4 sm:mb-6">
                                    <div className="p-4 rounded-2xl bg-destructive/10">
                                        <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive" strokeWidth={2} />
                                    </div>
                                </div>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                                    No Active Workout Plan
                                </h1>
                                <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
                                    You need to create and activate a workout plan before you can start tracking your workouts.
                                </p>
                                <button
                                    onClick={() => navigate("/home")}
                                    className="
                                        inline-flex items-center gap-2
                                        min-h-[44px] px-6 sm:px-8 py-3 sm:py-3.5
                                        rounded-xl
                                        bg-primary text-primary-foreground
                                        text-sm sm:text-base font-semibold
                                        hover:opacity-90 active:scale-[0.98]
                                        transition-all duration-200
                                        touch-manipulation
                                        shadow-lg hover:shadow-xl
                                    "
                                >
                                    <PlusCircle className="w-5 h-5" strokeWidth={2} />
                                    <span>Go to Home & Create Plan</span>
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

            <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-[env(safe-area-inset-bottom)]">
                <div className="w-full max-w-4xl mx-auto">
                    {/* Header Section - Mobile-first, informative */}
                    <div className="mb-4 sm:mb-6 animate-[workout-slide-up_0.5s_ease-out_both]">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10">
                                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary" strokeWidth={2} />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                                        Workout Session
                                    </h1>
                                    {activePlanName && (
                                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                            {activePlanName}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Slide indicator dots - modern and informative */}
                        {slidesCount > 0 && (
                            <div className="flex items-center justify-between gap-2 sm:gap-3">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    {Array.from({ length: slidesCount }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                if (!isAnimating) setIndex(i);
                                            }}
                                            className={`
                                                transition-all duration-300 touch-manipulation
                                                ${i === index
                                                    ? "w-8 sm:w-10 h-2 sm:h-2.5 bg-primary rounded-full animate-[workout-indicator-active_1.5s_ease-in-out_infinite]"
                                                    : "w-2 h-2 bg-muted-foreground/30 rounded-full hover:bg-muted-foreground/50"
                                                }
                                            `}
                                            aria-label={`Go to slide ${i + 1}`}
                                        />
                                    ))}
                                </div>
                                <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                                    <span className="hidden sm:inline">{slideLabels[index]} · </span>
                                    {index + 1} / {slidesCount}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Card Container */}
                    {slidesCount > 0 && (
                        <div className="bg-card rounded-2xl sm:rounded-3xl shadow-lg border border-border overflow-hidden animate-[workout-scale-in_0.4s_ease-out_0.1s_both]">
                            {/* SLIDER VIEWPORT */}
                            <div
                                className="relative overflow-hidden"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <div
                                    ref={sliderRef}
                                    className="flex transition-transform duration-300"
                                    style={{ width: `${slidesCount * 100}%` }}
                                >
                                {/* SLIDE 0: LastDay + AddPresentDay */}
                                <div
                                    className="shrink-0 px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6"
                                    style={{ width: `${100 / slidesCount}%` }}
                                >
                                    <section className="bg-secondary/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-border/50 max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-320px)] md:max-h-[600px] overflow-y-auto custom-scrollbar">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch">
                                            <div className="animate-[workout-fade-in_0.4s_ease-out_0.2s_both]">
                                                <LastDay />
                                            </div>
                                            <div className="animate-[workout-fade-in_0.4s_ease-out_0.3s_both]">
                                                <AddPresentDay />
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* SLIDE 1: TodaysPastWorkouts */}
                                <div
                                    className="shrink-0 px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6"
                                    style={{ width: `${100 / slidesCount}%` }}
                                >
                                    <section className="bg-secondary/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-border/50 max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-320px)] md:max-h-[600px] overflow-y-auto custom-scrollbar">
                                        <div className="animate-[workout-fade-in_0.4s_ease-out_both]">
                                            <TodaysPastWorkouts />
                                        </div>
                                    </section>
                                </div>

                                {/* SLIDE 2: AddSets + SeePastWorkout */}
                                {hasActivePlan && canStartWorkout && (
                                    <div
                                        className="shrink-0 px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6"
                                        style={{ width: `${100 / slidesCount}%` }}
                                    >
                                        <section className="bg-secondary/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-border/50 flex flex-col gap-3 sm:gap-4 max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-320px)] md:max-h-[600px] overflow-y-auto custom-scrollbar">
                                            <div className="animate-[workout-fade-in_0.4s_ease-out_0.1s_both]">
                                                <AddSets />
                                            </div>
                                            <div className="animate-[workout-fade-in_0.4s_ease-out_0.2s_both]">
                                                <SeePastWorkout />
                                            </div>
                                        </section>
                                    </div>
                                )}
                                </div>

                            {/* Navigation Buttons - Enhanced */}
                            {index > 0 && (
                                <button
                                    onClick={prev}
                                    disabled={isAnimating}
                                    aria-label="Previous slide"
                                    className="
                                        absolute left-2 sm:left-4 top-1/2 -translate-y-1/2
                                        min-h-[44px] h-11 w-11 sm:h-12 sm:w-12
                                        flex items-center justify-center
                                        rounded-full
                                        border border-border
                                        bg-card/95 backdrop-blur-md
                                        text-foreground
                                        shadow-lg
                                        transition-all duration-200
                                        hover:bg-card hover:scale-110 hover:shadow-xl
                                        active:scale-95
                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                        touch-manipulation
                                        z-10
                                    "
                                >
                                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                                </button>
                            )}

                            {index < slidesCount - 1 && (
                                <button
                                    onClick={next}
                                    disabled={isAnimating}
                                    aria-label="Next slide"
                                    className="
                                        absolute right-2 sm:right-4 top-1/2 -translate-y-1/2
                                        min-h-[44px] h-11 w-11 sm:h-12 sm:w-12
                                        flex items-center justify-center
                                        rounded-full
                                        border border-border
                                        bg-card/95 backdrop-blur-md
                                        text-foreground
                                        shadow-lg
                                        transition-all duration-200
                                        hover:bg-card hover:scale-110 hover:shadow-xl
                                        active:scale-95
                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                        touch-manipulation
                                        z-10
                                    "
                                >
                                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                                </button>
                            )}
                            </div>

                            {/* Bottom Info Bar */}
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50 bg-muted/30">
                                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">Swipe or use arrows to navigate</span>
                                        <span className="sm:hidden">Swipe to navigate</span>
                                    </div>
                                    {hasActivePlan && canStartWorkout && (
                                        <div className="flex items-center gap-1.5 text-chart-1">
                                            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            <span>Ready to add sets</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
