import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check, ChevronDown, Minus, Plus, Sliders, Trash2,
} from "lucide-react";
import PageHeader from "../components/PageHeader.tsx";
import Empty from "../components/Empty.tsx";
import Sheet from "../components/Sheet.tsx";
import RestTimer from "../components/RestTimer.tsx";
import MusclePicker from "../components/MusclePicker.tsx";
import Chip from "../components/Chip.tsx";
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

  useEffect(() => {
    (async () => {
      if (!plan) { setDay(null); return; }
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

  const totalSets = groups.reduce((a, g) => a + g.sets.length, 0);
  const totalVolume = groups.reduce(
    (a, g) => a + g.sets.reduce((s, e) => s + (e.is_body_weighted ? 0 : e.weight) * e.number_of_reps, 0),
    0,
  );

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
            className="press inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-card border border-border-2 text-sm font-semibold"
          >
            <span className="capitalize">{dayType}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        }
      />

      <div className="px-5 space-y-4 stagger">
        {/* Session summary mini-strip */}
        {groups.length > 0 && (
          <div className="surface p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">Session</p>
              <p className="font-display text-2xl font-extrabold tabular-nums leading-none mt-1">
                {totalSets} <span className="text-sm font-bold text-muted-foreground">sets</span>
              </p>
            </div>
            <div className="h-10 w-px bg-border-2" />
            <div className="flex-1 text-right">
              <p className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">Volume</p>
              <p className="font-display text-2xl font-extrabold tabular-nums leading-none mt-1">
                {Math.round(totalVolume).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        <RestTimer />

        {groups.length === 0 ? (
          <Empty
            icon={Plus}
            title="Empty session"
            description="Add your first set for this workout."
            action={
              <button
                onClick={() => setAddSheetOpen(true)}
                className="btn-primary press inline-flex items-center gap-2 px-5 py-3"
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

      {/* Floating Add Set button (positioned above bottom nav, accounting for FAB) */}
      {groups.length > 0 && (
        <button
          onClick={() => setAddSheetOpen(true)}
          className="press fixed left-5 z-30 inline-flex items-center gap-2 font-display font-bold text-[14px] text-primary-foreground px-5 py-3 rounded-full"
          style={{
            bottom: `calc(var(--nav-height) + var(--safe-bottom) + 1.25rem)`,
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)",
            boxShadow: "var(--shadow-glow)",
          }}
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
              if ("vibrate" in navigator) navigator.vibrate?.(20);
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
      setHistory(days.slice(0, 10).map((d) => ({
        type: (d.day_type_name?.[0] ?? "") as string,
        date: d.created_at,
      })));
    })();
  }, [planId]);

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {options.map((t, idx) => {
          const active = t === current;
          return (
            <button
              key={`${t}-${idx}`}
              onClick={() => onPicked(t, idx)}
              className={`press rounded-2xl py-4 font-display font-bold tracking-tight text-base capitalize transition-all ${
                active ? "text-primary-foreground" : "bg-card-2 text-foreground"
              }`}
              style={active ? { background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)", boxShadow: "var(--shadow-glow)" } : undefined}
            >
              {t}
            </button>
          );
        })}
      </div>
      {history.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-[0.1em] font-semibold text-muted-foreground mb-2 px-1">Recent sessions</p>
          <ul className="text-sm space-y-1.5">
            {history.map((h, i) => (
              <li key={i} className="flex justify-between text-muted-foreground bg-card-2 rounded-lg px-3 py-2">
                <span className="font-medium text-foreground capitalize">{h.type}</span>
                <span className="text-[11px]">{new Date(h.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
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
    <div className="surface p-4">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setCollapsed((v) => !v)} className="press text-left flex-1 min-w-0">
          <p className="font-display font-bold text-[15px] truncate">{group.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Chip variant="primary" className="!text-[10px]">{group.sets.length} sets</Chip>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {Math.round(volume).toLocaleString()} {group.bodyweight ? "reps" : "kg·reps"}
            </span>
          </div>
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete all sets for "${group.name}"?`)) {
              deleteExerciseGroup(group.sets[0]!.workout_day_id, group.name).then(onChanged);
            }
          }}
          className="press h-9 w-9 grid place-items-center rounded-full bg-muted text-destructive shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {!collapsed && (
        <ul className="mt-3 space-y-1.5">
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

  const commit = async (patch: { reps?: number; weight?: number; done?: boolean }) => {
    await updateSet(set.id, {
      ...(patch.reps !== undefined ? { reps: patch.reps } : {}),
      ...(patch.weight !== undefined ? { weight: patch.weight } : {}),
      ...(patch.done !== undefined ? { is_the_exercise_done: patch.done } : {}),
    });
    onChanged();
    if (patch.done && "vibrate" in navigator) navigator.vibrate?.(10);
  };

  return (
    <li className="bg-card-2 rounded-xl px-2.5 py-2 flex items-center gap-2">
      <button
        onClick={() => commit({ done: !set.is_the_exercise_done })}
        className={`press h-7 w-7 grid place-items-center rounded-full transition-all shrink-0 ${
          set.is_the_exercise_done ? "text-primary-foreground" : "bg-card text-muted-foreground border border-border-2"
        }`}
        style={set.is_the_exercise_done
          ? { background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)" }
          : undefined}
        aria-label="Mark done"
      >
        {set.is_the_exercise_done ? <Check className="h-3.5 w-3.5" /> : <span className="text-[11px] font-bold tabular-nums">{index}</span>}
      </button>

      <NumStepper
        flex
        value={weight}
        onChange={setWeight}
        onCommit={() => commit({ weight })}
        suffix="kg"
        disabled={set.is_body_weighted}
        step={2.5}
        muted={set.is_body_weighted}
      />
      <span className="text-muted-foreground/60 text-xs">×</span>
      <NumStepper
        flex
        value={reps}
        onChange={setReps}
        onCommit={() => commit({ reps })}
        suffix="reps"
        step={1}
        min={1}
      />
      <button
        onClick={() => deleteSet(set.id).then(onChanged)}
        className="press h-7 w-7 grid place-items-center rounded-lg text-destructive shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function NumStepper({
  value, onChange, onCommit, suffix, step = 1, min = 0,
  disabled = false, muted = false, flex = false,
}: {
  value: number; onChange: (n: number) => void; onCommit?: () => void;
  suffix?: string; step?: number; min?: number;
  disabled?: boolean; muted?: boolean; flex?: boolean;
}) {
  return (
    <div className={`flex items-center gap-0.5 bg-card border border-border-2 rounded-lg px-1 py-0.5 ${flex ? "flex-1" : ""} ${muted ? "opacity-60" : ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { const v = Math.max(min, value - step); onChange(v); onCommit?.(); }}
        className="press h-7 w-7 grid place-items-center rounded-md text-muted-foreground"
      >
        <Minus className="h-3 w-3" />
      </button>
      <div className="flex-1 text-center">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          onBlur={onCommit}
          className="w-full max-w-[60px] text-center font-display font-bold tabular-nums bg-transparent outline-none text-[14px]"
        />
        {suffix && <span className="text-[9px] uppercase tracking-wider text-muted-foreground ml-0.5">{suffix}</span>}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { const v = value + step; onChange(v); onCommit?.(); }}
        className="press h-7 w-7 grid place-items-center rounded-md text-muted-foreground"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
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
  const [busy, setBusy] = useState(false);

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
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await addSet({
        dayId,
        name: name.trim(),
        reps,
        weight: bw ? 0 : weight,
        targatedMuscles: muscles,
        isBodyWeighted: bw,
      });
      onAdded();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-5 space-y-4">
      <div>
        <label className="text-[11px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">Exercise</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bench Press"
          className="mt-1.5 w-full bg-muted rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary font-medium"
        />
        {(suggestions.length > 0 || recentGroupNames.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(suggestions.length ? suggestions : recentGroupNames.slice(0, 6)).map((s) => (
              <button key={s} onClick={() => setName(s)} className="chip chip-outline press">{s}</button>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none bg-card-2 rounded-xl px-3 py-2.5">
        <input
          type="checkbox"
          checked={bw}
          onChange={(e) => setBw(e.target.checked)}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        <span className="text-sm font-medium">Bodyweight exercise</span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <BigCounter label="Reps" value={reps} onChange={setReps} min={1} step={1} />
        <BigCounter label={bw ? "Added kg" : "Weight (kg)"} value={weight} onChange={setWeight} min={0} step={2.5} />
      </div>

      <button
        onClick={() => setMusclePickerOpen(true)}
        className="press w-full text-left bg-card-2 rounded-xl px-4 py-3"
      >
        <p className="text-[11px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">Targeted muscles</p>
        <p className="text-sm font-medium mt-0.5 truncate">
          {muscles.length ? `${muscles.length} selected` : "Optional — tap to add"}
        </p>
      </button>

      <button
        onClick={add}
        disabled={!name.trim() || busy}
        className="btn-primary press w-full py-3.5 text-[15px]"
      >
        {busy ? <span className="inline-block h-5 w-5 rounded-full border-2 border-white/70 border-t-transparent spin" /> : "Add set"}
      </button>

      <Sheet open={musclePickerOpen} onClose={() => setMusclePickerOpen(false)} title="Targeted muscles">
        <MusclePicker selected={muscles} onChange={setMuscles} />
      </Sheet>
    </div>
  );
}

function BigCounter({
  label, value, onChange, min = 0, step = 1,
}: { label: string; value: number; onChange: (n: number) => void; min?: number; step?: number }) {
  return (
    <div className="bg-card-2 rounded-xl p-2.5">
      <p className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-muted-foreground px-1.5">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="press h-9 w-9 grid place-items-center rounded-lg bg-card"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          step={step}
          min={min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 text-center font-display font-extrabold text-xl tabular-nums bg-transparent outline-none"
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
