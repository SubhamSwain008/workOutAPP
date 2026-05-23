import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Dumbbell, Search } from "lucide-react";
import PageHeader from "../components/PageHeader.tsx";
import Empty from "../components/Empty.tsx";
import Chip from "../components/Chip.tsx";
import { useActivePlanStore } from "../states/useActivePlanStore.ts";
import { listAllDays } from "../db/repos/days.ts";
import { listAllExercises } from "../db/repos/exercises.ts";
import { istDateString } from "../lib/time.ts";
import type { ExerciseRow, WorkoutDay } from "../models";

type DayWithEx = { day: WorkoutDay; sets: ExerciseRow[] };

export default function History() {
  const { plan } = useActivePlanStore();
  const [allDays, setAllDays] = useState<WorkoutDay[]>([]);
  const [allEx, setAllEx] = useState<ExerciseRow[]>([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(istDateString(new Date()));
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const [days, ex] = await Promise.all([listAllDays(), listAllExercises()]);
      setAllDays(plan ? days.filter((d) => d.plan_id === plan.id) : days);
      setAllEx(ex);
    })();
  }, [plan]);

  const dayMap = useMemo(() => {
    const m = new Map<string, DayWithEx[]>();
    for (const d of allDays) {
      const key = istDateString(d.created_at);
      const setsForDay = allEx.filter((e) => e.workout_day_id === d.id);
      const arr = m.get(key) ?? [];
      arr.push({ day: d, sets: setsForDay });
      m.set(key, arr);
    }
    return m;
  }, [allDays, allEx]);

  // Compute volume per day for heatmap intensity
  const volByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const [k, entries] of dayMap) {
      const v = entries.reduce((acc, e) =>
        acc + e.sets.reduce((s, ex) => s + (ex.is_body_weighted ? 0 : ex.weight) * ex.number_of_reps, 0), 0);
      m.set(k, v);
    }
    return m;
  }, [dayMap]);

  const maxVol = Math.max(1, ...Array.from(volByDay.values()));

  const selected = selectedDate ? dayMap.get(selectedDate) ?? [] : [];
  const filteredSelected = useMemo(() => {
    if (!search.trim()) return selected;
    const q = search.toLowerCase();
    return selected.map((d) => ({
      day: d.day,
      sets: d.sets.filter((s) => s.name.toLowerCase().includes(q)),
    })).filter((d) => d.sets.length > 0);
  }, [selected, search]);

  const totalDays = dayMap.size;
  const totalSets = allEx.length;
  const totalVol = useMemo(
    () => allEx.reduce((a, e) => a + (e.is_body_weighted ? 0 : e.weight) * e.number_of_reps, 0),
    [allEx],
  );

  return (
    <div className="page-in">
      <PageHeader title="History" subtitle={plan?.name ?? "All plans"} />
      <div className="px-5 space-y-4 stagger">
        {/* All-time strip */}
        <div className="surface p-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">Sessions</p>
            <p className="font-display font-extrabold text-xl tabular-nums mt-0.5">{totalDays}</p>
          </div>
          <div className="border-x border-border-2">
            <p className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">Sets</p>
            <p className="font-display font-extrabold text-xl tabular-nums mt-0.5">{totalSets}</p>
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-muted-foreground">Volume</p>
            <p className="font-display font-extrabold text-xl tabular-nums mt-0.5">{Math.round(totalVol).toLocaleString()}</p>
          </div>
        </div>

        <HeatCalendar
          month={month}
          volByDay={volByDay}
          maxVol={maxVol}
          selected={selectedDate}
          onSelect={setSelectedDate}
          onPrev={() => setMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}
          onNext={() => setMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}
        />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises…"
            className="w-full bg-muted rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
          />
        </div>

        {filteredSelected.length === 0 ? (
          <Empty
            icon={Dumbbell}
            title="No workout"
            description={selectedDate ? `Nothing logged on ${selectedDate}` : "Pick a date above"}
          />
        ) : (
          filteredSelected.map(({ day, sets }) => (
            <DayLogCard key={day.id} day={day} sets={sets} />
          ))
        )}
      </div>
    </div>
  );
}

function HeatCalendar({
  month, volByDay, maxVol, selected, onSelect, onPrev, onNext,
}: {
  month: { y: number; m: number };
  volByDay: Map<string, number>;
  maxVol: number;
  selected: string | null;
  onSelect: (d: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const first = new Date(month.y, month.m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const monthLabel = first.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const todayKey = istDateString(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="press h-9 w-9 grid place-items-center rounded-full bg-card-2">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-display font-bold text-sm">{monthLabel}</p>
        <button onClick={onNext} className="press h-9 w-9 grid place-items-center rounded-full bg-card-2">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((c, i) => {
          if (c === null) return <span key={i} />;
          const key = `${month.y}-${String(month.m + 1).padStart(2, "0")}-${String(c).padStart(2, "0")}`;
          const vol = volByDay.get(key) ?? 0;
          const intensity = vol / maxVol;
          const isToday = key === todayKey;
          const isSel = key === selected;
          const has = vol > 0;
          const bg = has
            ? `color-mix(in srgb, var(--primary) ${Math.max(18, Math.round(intensity * 80))}%, transparent)`
            : "var(--card-2)";
          return (
            <button
              key={i}
              onClick={() => onSelect(key)}
              className={`press relative aspect-square rounded-lg text-[12px] font-display font-bold flex items-center justify-center transition-all ${
                isSel ? "ring-2 ring-primary" : ""
              } ${isToday && !isSel ? "outline outline-1 outline-primary" : ""}`}
              style={{ background: bg, color: has || isSel ? "var(--foreground)" : "var(--muted-foreground)" }}
            >
              {c}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[9.5px] text-muted-foreground">
        <span>less</span>
        {[0.15, 0.35, 0.55, 0.8].map((i, k) => (
          <span
            key={k}
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: `color-mix(in srgb, var(--primary) ${i * 100}%, transparent)` }}
          />
        ))}
        <span>more</span>
      </div>
    </div>
  );
}

function DayLogCard({ day, sets }: { day: WorkoutDay; sets: ExerciseRow[] }) {
  const groups = useMemo(() => {
    const m = new Map<string, ExerciseRow[]>();
    for (const s of sets) {
      const arr = m.get(s.name) ?? [];
      arr.push(s);
      m.set(s.name, arr);
    }
    return [...m.entries()];
  }, [sets]);

  const dayType = (day.day_type_name?.[0] ?? "workout").toString();
  const vol = sets.reduce((a, s) => a + (s.is_body_weighted ? 0 : s.weight) * s.number_of_reps, 0);

  return (
    <div className="surface p-4">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="h-11 w-11 grid place-items-center rounded-xl font-display font-bold text-[11px] uppercase tracking-wider text-primary"
          style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)" }}
        >
          {dayType.slice(0, 3)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold capitalize text-sm">{dayType}</p>
          <p className="text-[11px] text-muted-foreground">
            {new Date(day.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="text-right">
          <Chip variant="primary">{sets.length} sets</Chip>
          <p className="text-[10.5px] text-muted-foreground mt-1 tabular-nums">vol {Math.round(vol).toLocaleString()}</p>
        </div>
      </div>
      <ul className="space-y-1.5">
        {groups.map(([name, items]) => (
          <li key={name} className="bg-card-2 rounded-xl px-3 py-2.5">
            <p className="font-medium text-sm">{name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
              {items.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && " · "}
                  {s.is_body_weighted ? "BW" : `${s.weight}kg`} × {s.number_of_reps}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
