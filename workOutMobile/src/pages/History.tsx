import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import PageHeader from "../components/PageHeader.tsx";
import Empty from "../components/Empty.tsx";
import { useActivePlanStore } from "../states/useActivePlanStore.ts";
import { listAllDays } from "../db/repos/days.ts";
import { listAllExercises } from "../db/repos/exercises.ts";
import { Dumbbell } from "lucide-react";
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

  const selected = selectedDate ? dayMap.get(selectedDate) ?? [] : [];

  const filteredSelected = useMemo(() => {
    if (!search.trim()) return selected;
    const q = search.toLowerCase();
    return selected.map((d) => ({
      day: d.day,
      sets: d.sets.filter((s) => s.name.toLowerCase().includes(q)),
    })).filter((d) => d.sets.length > 0);
  }, [selected, search]);

  return (
    <div className="page-in">
      <PageHeader title="History" subtitle={plan?.name ?? "All plans"} />
      <div className="px-5 space-y-5">
        <MonthCalendar
          month={month}
          dayMap={dayMap}
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
            className="w-full bg-muted rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
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

function MonthCalendar({
  month, dayMap, selected, onSelect, onPrev, onNext,
}: {
  month: { y: number; m: number };
  dayMap: Map<string, unknown[]>;
  selected: string | null;
  onSelect: (d: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const first = new Date(month.y, month.m, 1);
  const startDow = first.getDay(); // 0 = Sun
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const monthLabel = first.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const todayKey = istDateString(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="press h-9 w-9 grid place-items-center rounded-full bg-muted">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-semibold">{monthLabel}</p>
        <button onClick={onNext} className="press h-9 w-9 grid place-items-center rounded-full bg-muted">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] text-muted-foreground mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (c === null) return <span key={i} />;
          const key = `${month.y}-${String(month.m + 1).padStart(2, "0")}-${String(c).padStart(2, "0")}`;
          const has = dayMap.has(key);
          const isToday = key === todayKey;
          const isSel = key === selected;
          return (
            <button
              key={i}
              onClick={() => onSelect(key)}
              className={`press h-9 rounded-lg text-sm font-medium flex flex-col items-center justify-center relative ${
                isSel
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "bg-primary/10 text-primary"
                    : "text-foreground"
              }`}
            >
              {c}
              {has && !isSel && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
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

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {new Date(day.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
          <p className="font-semibold capitalize">
            {(day.day_type_name?.[0] ?? "workout").toString()}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{sets.length} sets</span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {groups.map(([name, items]) => (
          <li key={name} className="bg-muted rounded-xl p-3">
            <p className="font-medium text-sm">{name}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
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
