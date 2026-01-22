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

      <main className="flex justify-center px-2 py-8">
        <div className="w-full max-w-2xl bg-card rounded-xl shadow-lg border border-border p-4 relative">

          {/* ---------- HEADER ---------- */}
          <h1 className="text-2xl font-bold text-primary text-center mb-4">
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
                className="shrink-0 px-1"
                style={{ width: `${100 / slidesCount}%` }}
              >
                <section className="bg-secondary rounded-lg p-4 border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    <LastDay />
                    <AddPresentDay />
                  </div>
                </section>
              </div>

              {/* ---------- SLIDE 1 ---------- */}
              <div
                className="shrink-0 px-1"
                style={{ width: `${100 / slidesCount}%` }}
              >
                <section className="bg-secondary rounded-lg p-4 border border-border">
                  <TodaysPastWorkouts />
                </section>
              </div>

              {/* ---------- SLIDE 2 (AddSets + SeePastWorkout together) ---------- */}
              {canStartWorkout && (
                <div
                  className="shrink-0 px-1"
                  style={{ width: `${100 / slidesCount}%` }}
                >
                  <section className="bg-secondary rounded-lg p-4 border border-border flex flex-col gap-6">
                    <AddSets />
                    <SeePastWorkout />
                  </section>
                </div>
              )}
            </div>
          </div>

          {/* ---------- NAV BUTTONS ---------- */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={prev}
              disabled={index === 0}
              className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-40"
            >
              ← Previous
            </button>

            <div className="text-xs text-muted-foreground">
              {index + 1} / {slidesCount}
            </div>

            <button
              onClick={next}
              disabled={index === slidesCount - 1}
              className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
