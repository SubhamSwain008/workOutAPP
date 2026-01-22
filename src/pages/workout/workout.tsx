import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import Navbar from "../../components/navbar/navbar";
import AddPresentDay from "./addPresentday";
import LastDay from "./lastDay";
import AddSets from "./addSets";
import TodaysPastWorkouts from "./TodaypastWorkouts";
import SeePastWorkout from "./seePastWorkout";

import { useCanStartWorkoutStore } from "../../states/canStartWorkout";

export default function Workout() {
    const canStartWorkout = useCanStartWorkoutStore((s) => s.canStartWorkout);

    const sliderRef = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);

    // Slides:
    // 0 → LastDay + AddPresentDay
    // 1 → TodaysPastWorkouts
    // 2 → AddSets + SeePastWorkout
    const slidesCount = canStartWorkout ? 3 : 2;

    /* ---------- keep index valid ---------- */
    useEffect(() => {
        setIndex((i) => Math.min(i, slidesCount - 1));
    }, [slidesCount]);

    /* ---------- GSAP slide ---------- */
    useEffect(() => {
        if (!sliderRef.current) return;

        const percent = (index * 100) / slidesCount;

        gsap.to(sliderRef.current, {
            x: `-${percent}%`,
            duration: 0.6,
            ease: "power3.inOut",
        });
    }, [index, slidesCount]);

    const next = () => {
        setIndex((i) => Math.min(i + 1, slidesCount - 1));
    };

    const prev = () => {
        setIndex((i) => Math.max(i - 1, 0));
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-hidden">
            <Navbar />

            <main className="flex justify-center items-center px-1 py-3 md:py-4 mt-5">
                <div className="w-full max-w-2xl bg-card rounded-xl shadow-lg border border-border p-2 relative">

                    {/* inject scrollbar styles so thumb uses --primary */}
                    <style>{`
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: var(--primary) transparent;
            }
            .custom-scrollbar::-webkit-scrollbar {
              width: 10px;
              height: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: var(--primary);
              border-radius: 999px;
              border: 2px solid rgba(0,0,0,0);
              background-clip: padding-box;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              opacity: 0.9;
            }
          `}</style>

                    {/* ---------- HEADER ---------- */}
                    <h1 className="text-2xl font-bold text-primary text-center mb-2">
                        Workout Session
                    </h1>

                    {/* ---------- SLIDER VIEWPORT ---------- */}
                    <div className="relative overflow-hidden">
                        <div
                            ref={sliderRef}
                            className="flex"
                            style={{ width: `${slidesCount * 100}%` }}
                        >
                            {/* ---------- SLIDE 0 ---------- */}
                            <div
                                className="shrink-0 px-0"
                                style={{ width: `${100 / slidesCount}%` }}
                            >
                                <section className="bg-secondary rounded-lg p-2 border border-border max-h-[50vh] overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-stretch">
                                        <LastDay />
                                        <AddPresentDay />
                                    </div>
                                </section>
                            </div>

                            {/* ---------- SLIDE 1 ---------- */}
                            <div
                                className="shrink-0 px-0"
                                style={{ width: `${100 / slidesCount}%` }}
                            >
                                <section className="bg-secondary rounded-lg p-2 border border-border max-h-[50vh] overflow-y-auto custom-scrollbar">
                                    <TodaysPastWorkouts />
                                </section>
                            </div>

                            {/* ---------- SLIDE 2 (AddSets + SeePastWorkout together) ---------- */}
                            {canStartWorkout && (
                                <div
                                    className="shrink-0 px-0"
                                    style={{ width: `${100 / slidesCount}%` }}
                                >
                                    <section className="bg-secondary rounded-lg p-2 border border-border flex flex-col gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                        <AddSets />
                                        <SeePastWorkout />
                                    </section>
                                </div>
                            )}
                        </div>

                        {/* ---------- NAV BUTTONS ---------- */}
                        <button
                            onClick={prev}
                            disabled={index === 0}
                            aria-label="Previous"
                            className="
    absolute left-2 top-1/2 -translate-y-1/2
    h-10 w-10
    flex items-center justify-center
    rounded-full
    border border-border
    bg-card/80 backdrop-blur
    text-foreground
    shadow-md
    transition-all
    hover:bg-card hover:scale-105
    active:scale-95
    disabled:opacity-30 disabled:cursor-not-allowed
  "
                        >
                            <span className="text-lg">←</span>
                        </button>

                        <button
                            onClick={next}
                            disabled={index === slidesCount - 1}
                            aria-label="Next"
                            className="
    absolute right-2 top-1/2 -translate-y-1/2
    h-10 w-10
    flex items-center justify-center
    rounded-full
    border border-border
    bg-card/80 backdrop-blur
    text-foreground
    shadow-md
    transition-all
    hover:bg-card hover:scale-105
    active:scale-95
    disabled:opacity-30 disabled:cursor-not-allowed
  "
                        >
                            <span className="text-lg">→</span>
                        </button>

                    </div>

                    {/* ---------- SLIDER NAVIGATION INDICATOR ---------- */}
                    <div className="flex justify-center items-center mt-6">
                        <div className="text-xs text-muted-foreground">
                            {index + 1} / {slidesCount}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
