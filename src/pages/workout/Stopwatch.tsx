import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);            // ms
  const [isRunning, setIsRunning] = useState(false);
  const startRef = useRef<number>(0);                    // timestamp when unpaused
  const accRef = useRef<number>(0);                      // accumulated ms before last pause
  const rafRef = useRef<number>(0);

  const tick = useCallback(() => {
    setElapsed(accRef.current + (Date.now() - startRef.current));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (isRunning) {
      startRef.current = Date.now();
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, tick]);

  const toggle = () => {
    if (isRunning) {
      accRef.current += Date.now() - startRef.current;
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  };

  const reset = () => {
    setIsRunning(false);
    accRef.current = 0;
    setElapsed(0);
  };

  // --- format ---
  const totalSec = Math.floor(elapsed / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const centiseconds = Math.floor((elapsed % 1000) / 10);

  const timeStr = hours > 0
    ? `${hours}:${p(minutes)}:${p(seconds)}`
    : `${p(minutes)}:${p(seconds)}`;

  // fraction of 60‑second sweep (resets every minute)
  const sweepFraction = (seconds + centiseconds / 100) / 60;
  const dashOffset = CIRCUMFERENCE * (1 - sweepFraction);

  return (
    <div className="flex flex-col items-center gap-3 animate-[workout-fade-in_0.3s_ease-out_both]">
      {/* Ring */}
      <div className="relative w-32 h-32 sm:w-36 sm:h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Track */}
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none" strokeWidth="6"
            className="stroke-secondary"
          />
          {/* Progress arc */}
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={`transition-[stroke-dashoffset] duration-100 ${isRunning ? "stroke-primary" : elapsed > 0 ? "stroke-chart-5" : "stroke-secondary"}`}
          />
        </svg>

        {/* Center display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-mono font-bold text-foreground tabular-nums tracking-tight">
            {timeStr}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            .{p(centiseconds)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          disabled={elapsed === 0}
          className="w-9 h-9 rounded-full flex items-center justify-center
                     bg-secondary text-secondary-foreground
                     hover:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all touch-manipulation active:scale-90"
          aria-label="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center
                      shadow-lg transition-all touch-manipulation active:scale-90
                      ${isRunning
                        ? "bg-chart-3 text-white shadow-chart-3/25 hover:shadow-chart-3/40"
                        : "bg-primary text-primary-foreground shadow-primary/25 hover:shadow-primary/40"
                      }`}
          aria-label={isRunning ? "Pause" : "Start"}
        >
          {isRunning
            ? <Pause className="w-5 h-5" />
            : <Play className="w-5 h-5 ml-0.5" />
          }
        </button>

        {/* Spacer for symmetry */}
        <div className="w-9 h-9" />
      </div>
    </div>
  );
}

function p(n: number) {
  return String(n).padStart(2, "0");
}
