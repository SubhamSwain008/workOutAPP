import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useActivePlanStore } from "../../states/activeplan";

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Calendar() {
  const planId = useActivePlanStore((s) => s.id);
  const [dates, setDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!planId) return;
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("workout_day")
        .select("created_at")
        .eq("plan_id", planId)
        .order("created_at", { ascending: true });

      if (!mounted) return;
      if (!error && data) {
        const s = new Set<string>();
        data.forEach((r: any) => {
          if (r.created_at) s.add(new Date(r.created_at).toISOString().slice(0, 10));
        });
        setDates(s);
      }
      setLoading(false);
    };

    fetch();
    return () => {
      mounted = false;
    };
  }, [planId]);

  const { currentStreak, lastMax } = useMemo(() => {
    const arr = Array.from(dates).sort();
    if (arr.length === 0) return { currentStreak: 0, lastMax: 0 };

    const runs: Array<{ start: string; end: string; len: number }> = [];
    let runStart = arr[0];
    let prev = new Date(runStart);
    for (let i = 1; i < arr.length; i++) {
      const d = new Date(arr[i]);
      const diff = Math.round((d.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        prev = d;
      } else {
        runs.push({ start: runStart, end: prev.toISOString().slice(0, 10), len: Math.round((prev.getTime() - new Date(runStart).getTime()) / (1000 * 60 * 60 * 24)) + 1 });
        runStart = arr[i];
        prev = d;
      }
    }
    runs.push({ start: runStart, end: prev.toISOString().slice(0, 10), len: Math.round((prev.getTime() - new Date(runStart).getTime()) / (1000 * 60 * 60 * 24)) + 1 });

    const latest = arr[arr.length - 1];
    let currentStreak = 0;
    let currentRunIndex = -1;
    for (let i = runs.length - 1; i >= 0; i--) {
      const r = runs[i];
      if (r.end === latest) {
        currentStreak = r.len;
        currentRunIndex = i;
        break;
      }
    }

    let lastMax = 0;
    for (let i = 0; i < runs.length; i++) {
      if (i === currentRunIndex) continue;
      if (runs[i].len > lastMax) lastMax = runs[i].len;
    }

    return { currentStreak, lastMax };
  }, [dates]);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const cells: Array<{ label: string | null; ymd?: string }> = [];
  for (let i = 0; i < startDay; i++) cells.push({ label: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(now.getFullYear(), now.getMonth(), d);
    const ymd = dt.toISOString().slice(0, 10);
    cells.push({ label: String(d), ymd });
  }

  return (
    <div className="bg-background/80 rounded-xl border border-border p-4 sm:p-5 animate-[workout-fade-in_0.3s_ease-out_both]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
            Calendar — {now.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </h3>
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
          const has = c.ymd && dates.has(c.ymd);
          const isToday = c.ymd === new Date().toISOString().slice(0, 10);
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
