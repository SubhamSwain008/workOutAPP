import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";

const PRESETS = [60, 90, 120, 180];

export default function RestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [target, setTarget] = useState(90);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          if ("vibrate" in navigator) navigator.vibrate?.(300);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function start(t: number) {
    setTarget(t);
    setSecondsLeft(t);
    setRunning(true);
  }

  function toggle() {
    if (secondsLeft === 0) {
      setSecondsLeft(target);
      setRunning(true);
    } else {
      setRunning((r) => !r);
    }
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(0);
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const pct = target > 0 ? (secondsLeft / target) * 100 : 0;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div
          className={`relative h-14 w-14 rounded-full grid place-items-center ${
            running ? "pulse-ring" : ""
          }`}
          style={{
            background: `conic-gradient(var(--primary) ${pct}%, var(--muted) ${pct}%)`,
          }}
        >
          <div className="absolute inset-1 rounded-full bg-card grid place-items-center">
            <span className="font-mono text-sm font-semibold tabular-nums">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Timer className="h-3 w-3" /> Rest timer
          </p>
          <div className="mt-1.5 flex gap-1.5 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => start(p)}
                className={`press text-xs font-medium px-2.5 py-1 rounded-lg ${
                  target === p ? "bg-primary/15 text-primary" : "bg-muted"
                }`}
              >
                {p < 60 ? `${p}s` : `${p / 60}m`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggle}
            className="press h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground"
            aria-label={running ? "Pause" : "Start"}
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={reset}
            className="press h-10 w-10 grid place-items-center rounded-full bg-muted"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
