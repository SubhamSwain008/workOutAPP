import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown, Minus, Plus, Sliders, Trash2, Weight,
} from "lucide-react";
import PageHeader from "../components/PageHeader.tsx";
import Empty from "../components/Empty.tsx";
import Sheet from "../components/Sheet.tsx";
import RestTimer from "../components/RestTimer.tsx";
import MusclePicker from "../components/MusclePicker.tsx";
import { useActivePlanStore } from "../states/useActivePlanStore.ts";
import { getOrCreateTodayDay, listDaysForPlan } from "../db/repos/days.ts";
import {
  addSet, deleteExerciseGroup, deleteSet, listExercisesForDay, suggestExerciseNames, updateSet,
} from "../db/repos/exercises.ts";
import type { ExerciseRow, WorkoutDay } from "../models";

type Grouped = { name: string; sets: ExerciseRow[]; muscles: string[]; bodyweight: boolean };

export default function Workout() {
  const { plan } = useActivePlanStore();
  const [day, setDay] = useState<WorkoutDay | null>(null);
  const [groups, setGroups] = useState<Grouped[]>([]);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const dayType = day?.day_type_name?.[0] ?? plan?.split_type?.[0] ?? "";

  const refreshGroups = useCallback(async (d: WorkoutDay | null) => {
    if (!d) { setGroups([]); return; }
    const ex = await listExercisesForDay(d.id);
    const byName = new Map<string, Grouped>();
    for (const e of ex) {
      const g = byName.get(e.name) ?? { name: e.name, sets: [], muscles: e.targated_muscles, bodyweight: e.is_body_weighted };
      g.sets.push(e);
      byName.set(e.name, g);
    }
    setGroups([...byName.values()]);
  }, []);

  // Pick today's day (or yesterday's if no day selected yet) based on the active plan.
  useEffect(() => {
    (async () => {
      if (!plan) { setDay(null); return; }
      // If the user already has a day for today, use it; else create one for the first split type.
      const startType = plan.split_type[0] ?? "workout";
      const d = await getOrCreateTodayDay({
        planId: plan.id,
        dayTypeName: [startType],
        dayIndex: 0,
      });
      setDay(d);
    })();
  }, [plan]);

  useEffect(() => { refreshGroups(day); }, [day, refreshGroups]);

  if (!plan) {
    return (
      <div className="page-in">
        <PageHeader title="Workout" />
        <div className="px-5">
          <Empty
            icon={Sliders}
            title="No active plan"
            description="Set an active plan from Home to start logging."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-in">
      <PageHeader
        title={plan.name}
        subtitle={day ? new Date(day.created_at).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }) : ""}
        right={
          <button
            onClick={() => setDayPickerOpen(true)}
            className="press inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-sm font-medium"
          >
            {dayType} <ChevronDown className="h-3.5 w-3.5" />
          </button>
        }
      />

      <div className="px-5 space-y-4">
        <RestTimer />

        {groups.length === 0 ? (
          <Empty
            icon={Plus}
            title="No sets yet"
            description="Add your first set for this session."
            action={
              <button
                onClick={() => setAddSheetOpen(true)}
                className="press inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 font-medium"
              >
                <Plus className="h-4 w-4" /> Add set
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <ExerciseCard
                key={g.name}
                group={g}
                onChanged={() => refreshGroups(day)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating add button */}
      {groups.length > 0 && (
        <button
          onClick={() => setAddSheetOpen(true)}
          className="press fixed left-1/2 -translate-x-1/2 bottom-[calc(var(--nav-height)+var(--safe-bottom)+1rem)] bg-primary text-primary-foreground rounded-full pl-4 pr-5 py-3 shadow-lg inline-flex items-center gap-2 font-semibold z-30"
        >
          <Plus className="h-5 w-5" /> Add set
        </button>
      )}

      <Sheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)} title="Add set">
        {day && (
          <AddSetForm
            dayId={day.id}
            recentGroupNames={groups.map((g) => g.name)}
            onAdded={async () => {
              await refreshGroups(day);
              setAddSheetOpen(false);
            }}
          />
        )}
      </Sheet>

      <Sheet open={dayPickerOpen} onClose={() => setDayPickerOpen(false)} title="Day type">
        {plan && (
          <DayTypePicker
            planId={plan.id}
            current={dayType}
            options={plan.split_type}
            onPicked={async (t, idx) => {
              const d = await getOrCreateTodayDay({
                planId: plan.id,
                dayTypeName: [t],
                dayIndex: idx,
              });
              setDay(d);
              setDayPickerOpen(false);
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

function DayTypePicker({
  planId, current, options, onPicked,
}: {
  planId: string;
  current: string;
  options: string[];
  onPicked: (t: string, idx: number) => void;
}) {
  const [history, setHistory] = useState<{ type: string; date: string }[]>([]);
  useEffect(() => {
    (async () => {
      const days = await listDaysForPlan(planId);
      setHistory(
        days.slice(0, 10).map((d) => ({
          type: (d.day_type_name?.[0] ?? "") as string,
          date: d.created_at,
        })),
      );
    })();
  }, [planId]);

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {options.map((t, idx) => (
          <button
            key={`${t}-${idx}`}
            onClick={() => onPicked(t, idx)}
            className={`press rounded-2xl py-3 font-semibold ${
              t === current ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {history.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Recent sessions</p>
          <ul className="text-sm space-y-1.5">
            {history.map((h, i) => (
              <li key={i} className="flex justify-between text-muted-foreground">
                <span className="font-medium text-foreground capitalize">{h.type}</span>
                <span>{new Date(h.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ group, onChanged }: { group: Grouped; onChanged: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const volume = useMemo(
    () => group.sets.reduce((acc, s) => acc + (s.is_body_weighted ? 0 : s.weight) * s.number_of_reps, 0),
    [group],
  );

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setCollapsed((v) => !v)} className="text-left flex-1 min-w-0">
          <p className="font-semibold truncate">{group.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {group.sets.length} sets · vol {volume.toLocaleString()} {group.bodyweight ? "(BW)" : "kg·reps"}
          </p>
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete all sets for "${group.name}"?`)) {
              deleteExerciseGroup(group.sets[0]!.workout_day_id, group.name).then(onChanged);
            }
          }}
          className="press h-9 w-9 grid place-items-center rounded-full bg-muted text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {!collapsed && (
        <ul className="mt-3 divide-y divide-border">
          {group.sets.map((s, i) => (
            <SetRow key={s.id} set={s} index={i + 1} onChanged={onChanged} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SetRow({ set, index, onChanged }: { set: ExerciseRow; index: number; onChanged: () => void }) {
  const [reps, setReps] = useState(set.number_of_reps);
  const [weight, setWeight] = useState(set.weight);

  useEffect(() => {
    setReps(set.number_of_reps);
    setWeight(set.weight);
  }, [set.id, set.number_of_reps, set.weight]);

  const commit = async (patch: { reps?: number; weight?: number }) => {
    await updateSet(set.id, patch);
    onChanged();
  };

  return (
    <li className="py-2.5 flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-7">#{index}</span>
      <div className="flex items-center gap-1 flex-1">
        <button
          onClick={() => commit({ weight: Math.max(0, weight - 2.5) })}
          className="press h-8 w-8 grid place-items-center rounded-lg bg-muted"
          disabled={set.is_body_weighted}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        {set.is_body_weighted ? (
          <span className="flex-1 text-center font-semibold text-xs text-muted-foreground">Bodyweight</span>
        ) : (
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            onBlur={() => commit({ weight })}
            className="w-full text-center font-semibold tabular-nums bg-transparent outline-none text-base"
            step="2.5"
          />
        )}
        <button
          onClick={() => commit({ weight: weight + 2.5 })}
          className="press h-8 w-8 grid place-items-center rounded-lg bg-muted"
          disabled={set.is_body_weighted}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <Weight className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="flex items-center gap-1 w-28">
        <button
          onClick={() => commit({ reps: Math.max(1, reps - 1) })}
          className="press h-8 w-8 grid place-items-center rounded-lg bg-muted"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(Number(e.target.value))}
          onBlur={() => commit({ reps })}
          className="w-full text-center font-semibold tabular-nums bg-transparent outline-none text-base"
        />
        <button
          onClick={() => commit({ reps: reps + 1 })}
          className="press h-8 w-8 grid place-items-center rounded-lg bg-muted"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        onClick={() => deleteSet(set.id).then(onChanged)}
        className="press h-8 w-8 grid place-items-center rounded-lg text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function AddSetForm({
  dayId, recentGroupNames, onAdded,
}: { dayId: string; recentGroupNames: string[]; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(20);
  const [bw, setBw] = useState(false);
  const [muscles, setMuscles] = useState<string[]>([]);
  const [musclePickerOpen, setMusclePickerOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!name) { setSuggestions([]); return; }
      const s = await suggestExerciseNames(name, 6);
      if (!canceled) setSuggestions(s);
    })();
    return () => { canceled = true; };
  }, [name]);

  async function add() {
    if (!name.trim()) return;
    await addSet({
      dayId,
      name: name.trim(),
      reps,
      weight: bw ? 0 : weight,
      targatedMuscles: muscles,
      isBodyWeighted: bw,
    });
    onAdded();
  }

  return (
    <div className="p-5 space-y-4">
      <div>
        <label className="text-xs text-muted-foreground">Exercise</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bench Press"
          className="mt-1 w-full bg-muted rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
        />
        {(suggestions.length > 0 || recentGroupNames.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(suggestions.length ? suggestions : recentGroupNames.slice(0, 6)).map((s) => (
              <button
                key={s}
                onClick={() => setName(s)}
                className="press text-xs font-medium px-2.5 py-1 rounded-full bg-card border border-border"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm flex-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={bw}
            onChange={(e) => setBw(e.target.checked)}
            className="mr-2 align-middle accent-[var(--primary)]"
          />
          Bodyweight exercise
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Counter label="Reps" value={reps} onChange={setReps} min={1} step={1} />
        <Counter label={bw ? "Added kg" : "Weight (kg)"} value={weight} onChange={setWeight} min={0} step={2.5} />
      </div>

      <button
        onClick={() => setMusclePickerOpen(true)}
        className="press w-full text-left bg-muted rounded-xl px-4 py-3"
      >
        <p className="text-xs text-muted-foreground">Targeted muscles</p>
        <p className="text-sm font-medium mt-0.5 truncate">
          {muscles.length ? `${muscles.length} selected` : "Optional — tap to add"}
        </p>
      </button>

      <button
        onClick={add}
        disabled={!name.trim()}
        className="press w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-semibold disabled:opacity-50"
      >
        Add set
      </button>

      <Sheet open={musclePickerOpen} onClose={() => setMusclePickerOpen(false)} title="Targeted muscles">
        <MusclePicker selected={muscles} onChange={setMuscles} />
      </Sheet>
    </div>
  );
}

function Counter({
  label, value, onChange, min = 0, step = 1,
}: {
  label: string; value: number; onChange: (n: number) => void; min?: number; step?: number;
}) {
  return (
    <div className="bg-muted rounded-xl p-2.5">
      <p className="text-[11px] text-muted-foreground px-1.5">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="press h-9 w-9 grid place-items-center rounded-lg bg-card"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 text-center font-bold text-lg tabular-nums bg-transparent outline-none"
        />
        <button
          onClick={() => onChange(value + step)}
          className="press h-9 w-9 grid place-items-center rounded-lg bg-card"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
