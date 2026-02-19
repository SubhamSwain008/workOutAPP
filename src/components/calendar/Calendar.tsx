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
    <div className="mt-4 p-3 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-medium">Calendar — {now.toLocaleString(undefined, { month: "long", year: "numeric" })}</h3>
          <div className="text-xs text-muted-foreground">Current streak: <span className="font-semibold">{currentStreak}</span> · Last max: <span className="font-semibold">{lastMax}</span></div>
        </div>
        {loading ? <div className="text-xs text-muted-foreground">Loading…</div> : null}
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-center text-muted-foreground">{d}</div>
        ))}
        {cells.map((c, i) => {
          if (!c.label) return <div key={i} />;
          const has = c.ymd && dates.has(c.ymd);
          const isToday = c.ymd === new Date().toISOString().slice(0, 10);
          return (
            <div key={i} className="h-8 flex items-center justify-center">
              <div className={`w-8 h-8 flex items-center justify-center rounded ${has ? 'bg-primary text-primary-foreground' : 'text-foreground'} ${isToday ? 'ring-2 ring-offset-1 ring-primary/40' : ''}`}>
                {c.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
