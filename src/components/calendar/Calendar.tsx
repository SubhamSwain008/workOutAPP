import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useActivePlanStore } from "../../states/activeplan";

// Format a Date into "YYYY-MM-DD" in IST. Using toISOString() here would
// convert to UTC and shift the date for IST users (e.g. a workout at
// 1 AM IST on Apr 9 becomes 7:30 PM UTC on Apr 8).
function toISTKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

// Build a "YYYY-MM-DD" key from explicit year/month/day (treated as local/IST).
function ymdKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${m}-${dd}`;
}

// Convert a "YYYY-MM-DD" string to a day index (days since epoch) so we can
// compute day-diffs independent of timezone/DST.
function keyToDayIndex(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export default function Calendar() {
  const planId = useActivePlanStore((s) => s.id);
  const [dates, setDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const todayIST = toISTKey(now);
  const [todayY, todayM] = [Number(todayIST.slice(0, 4)), Number(todayIST.slice(5, 7)) - 1];

  const [viewYear, setViewYear] = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM);

  useEffect(() => {
    if (!planId) {
      setDates(new Set());
      return;
    }
    let mounted = true;
    const run = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("workout_day")
        .select("created_at")
        .eq("plan_id", planId)
        .order("created_at", { ascending: true });

      if (!mounted) return;
      if (!error && data) {
        const s = new Set<string>();
        data.forEach((r: { created_at: string | null }) => {
          if (r.created_at) s.add(toISTKey(new Date(r.created_at)));
        });
        setDates(s);
      }
      setLoading(false);
    };

    run();
    return () => {
      mounted = false;
    };
  }, [planId]);

  const { currentStreak, lastMax } = useMemo(() => {
    const arr = Array.from(dates).sort();
    if (arr.length === 0) return { currentStreak: 0, lastMax: 0 };

    // Compress into runs of consecutive days using day indices.
    const runs: Array<{ endKey: string; len: number }> = [];
    let runStartIdx = keyToDayIndex(arr[0]);
    let prevIdx = runStartIdx;
    let prevKey = arr[0];

    for (let i = 1; i < arr.length; i++) {
      const curKey = arr[i];
      const curIdx = keyToDayIndex(curKey);
      if (curIdx - prevIdx === 1) {
        prevIdx = curIdx;
        prevKey = curKey;
      } else {
        runs.push({ endKey: prevKey, len: prevIdx - runStartIdx + 1 });
        runStartIdx = curIdx;
        prevIdx = curIdx;
        prevKey = curKey;
      }
    }
    runs.push({ endKey: prevKey, len: prevIdx - runStartIdx + 1 });

    // Current streak only counts if the most recent run ends today or yesterday.
    const todayIdx = keyToDayIndex(todayIST);
    const latestRun = runs[runs.length - 1];
    const latestIdx = keyToDayIndex(latestRun.endKey);
    const isCurrent = todayIdx - latestIdx <= 1;

    const currentStreak = isCurrent ? latestRun.len : 0;
    const skipIndex = isCurrent ? runs.length - 1 : -1;

    let lastMax = 0;
    for (let i = 0; i < runs.length; i++) {
      if (i === skipIndex) continue;
      if (runs[i].len > lastMax) lastMax = runs[i].len;
    }

    return { currentStreak, lastMax };
  }, [dates, todayIST]);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: Array<{ label: string | null; ymd?: string }> = [];
  for (let i = 0; i < startDay; i++) cells.push({ label: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ label: String(d), ymd: ymdKey(viewYear, viewMonth, d) });
  }

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isViewingCurrentMonth = viewYear === todayY && viewMonth === todayM;
  const monthLabel = firstOfMonth.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="bg-background/80 rounded-xl border border-border p-4 sm:p-5 animate-[workout-fade-in_0.3s_ease-out_both]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous month"
              className="p-1.5 rounded-md text-foreground hover:bg-muted/60 transition-colors touch-manipulation"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-base sm:text-lg font-bold text-foreground min-w-36 text-center">
              {monthLabel}
            </h3>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next month"
              className="p-1.5 rounded-md text-foreground hover:bg-muted/60 transition-colors touch-manipulation"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isViewingCurrentMonth && (
              <button
                type="button"
                onClick={() => { setViewYear(todayY); setViewMonth(todayM); }}
                className="ml-1 text-xs font-semibold text-primary hover:underline"
              >
                Today
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-chart-1" />
              <span className="text-muted-foreground">Current streak: <span className="font-semibold text-foreground">{currentStreak}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-chart-3" />
              <span className="text-muted-foreground">Last max: <span className="font-semibold text-foreground">{lastMax}</span></span>
            </div>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading…</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-center text-muted-foreground font-semibold py-1">{d}</div>
        ))}
        {cells.map((c, i) => {
          if (!c.label) return <div key={i} />;
          const has = c.ymd ? dates.has(c.ymd) : false;
          const isToday = c.ymd === todayIST;
          return (
            <div key={i} className="h-9 sm:h-10 flex items-center justify-center">
              <div className={`
                w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg transition-all duration-200
                ${has
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'text-foreground hover:bg-muted/50'
                }
                ${isToday ? 'ring-2 ring-primary/50 ring-offset-1' : ''}
              `}>
                {c.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
