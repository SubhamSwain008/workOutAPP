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
          if ("vibrate" in navigator) navigator.vibrate?.([180, 80, 180]);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function start(t: number) {
    setTarget(t); setSecondsLeft(t); setRunning(true);
  }
  function toggle() {
    if (secondsLeft === 0) { setSecondsLeft(target); setRunning(true); }
    else setRunning((r) => !r);
  }
  function reset() { setRunning(false); setSecondsLeft(0); }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const pct = target > 0 ? (secondsLeft / target) * 100 : 0;

  return (
    <div className="surface p-3.5">
      <div className="flex items-center gap-3">
        <div
          className={`relative h-14 w-14 rounded-full grid place-items-center shrink-0 ${running ? "glow-pulse" : ""}`}
          style={{
            background: `conic-gradient(var(--primary) ${pct}%, var(--muted) ${pct}%)`,
          }}
        >
          <div className="absolute inset-[3px] rounded-full bg-card grid place-items-center">
            <span className="font-mono text-[13px] font-semibold tabular-nums">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">
            <Timer className="h-3 w-3" /> Rest
          </div>
          <div className="mt-1 flex gap-1 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => start(p)}
                className={`press text-[11px] font-semibold px-2.5 py-1 rounded-lg tabular-nums ${
                  target === p ? "bg-primary/15 text-primary" : "bg-card-2 text-foreground"
                }`}
              >
                {p < 60 ? `${p}s` : `${p / 60}m`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggle}
            className="press h-10 w-10 grid place-items-center rounded-full text-white"
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)" }}
            aria-label={running ? "Pause" : "Start"}
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <button
            onClick={reset}
            className="press h-10 w-10 grid place-items-center rounded-full bg-card-2"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
