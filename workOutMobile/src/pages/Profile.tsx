import { useEffect, useState } from "react";
import { Save, User } from "lucide-react";
import PageHeader from "../components/PageHeader.tsx";
import { useUserStore } from "../states/useUserStore.ts";
import { getProfile, upsertProfile } from "../db/repos/profile.ts";
import type { Profile as ProfileType } from "../models";

const GENDERS = ["male", "female", "other"];
const GOALS = ["hypertrophy", "strength", "fat loss", "endurance", "general fitness"];

function bmi(weightKg: number | null, heightCm: number | null): { v: number | null; cat: string } {
  if (!weightKg || !heightCm) return { v: null, cat: "" };
  const m = heightCm / 100;
  const v = +(weightKg / (m * m)).toFixed(1);
  const cat = v < 18.5 ? "underweight" : v < 25 ? "healthy" : v < 30 ? "overweight" : "obese";
  return { v, cat };
}

export default function Profile() {
  const userId = useUserStore((s) => s.userId);
  const username = useUserStore((s) => s.username);
  const [p, setP] = useState<ProfileType | null>(null);
  const [draft, setDraft] = useState<{
    name: string; age: string; height: string; weight: string; gender: string; goal: string;
  }>({ name: "", age: "", height: "", weight: "", gender: "", goal: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getProfile(userId).then((row) => {
      setP(row);
      setDraft({
        name: row?.name ?? "",
        age: row?.age?.toString() ?? "",
        height: row?.height?.toString() ?? "",
        weight: row?.weight?.toString() ?? "",
        gender: row?.gender ?? "",
        goal: row?.current_goal ?? "",
      });
    });
  }, [userId]);

  async function save() {
    if (!userId) return;
    const updated = await upsertProfile(userId, {
      name: draft.name || null,
      age: draft.age ? Number(draft.age) : null,
      height: draft.height ? Number(draft.height) : null,
      weight: draft.weight ? Number(draft.weight) : null,
      gender: draft.gender || null,
      current_goal: draft.goal || null,
    });
    setP(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const w = draft.weight ? Number(draft.weight) : null;
  const h = draft.height ? Number(draft.height) : null;
  const { v: bmiV, cat: bmiCat } = bmi(w, h);

  return (
    <div className="page-in">
      <PageHeader title="Profile" />
      <div className="px-5 space-y-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">{draft.name || username}</p>
            <p className="text-xs text-muted-foreground">@{username}</p>
          </div>
        </div>

        {bmiV && (
          <div className="card p-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">BMI</p>
              <p className="text-3xl font-bold mt-0.5 tabular-nums">{bmiV}</p>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/12 text-primary capitalize">{bmiCat}</span>
          </div>
        )}

        <div className="card p-4 space-y-3">
          <Field label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <div className="grid grid-cols-3 gap-2">
            <Field label="Age" value={draft.age} type="number" onChange={(v) => setDraft({ ...draft, age: v })} />
            <Field label="Height (cm)" value={draft.height} type="number" onChange={(v) => setDraft({ ...draft, height: v })} />
            <Field label="Weight (kg)" value={draft.weight} type="number" onChange={(v) => setDraft({ ...draft, weight: v })} />
          </div>
          <ChipSelect
            label="Gender"
            value={draft.gender}
            options={GENDERS}
            onChange={(v) => setDraft({ ...draft, gender: v })}
          />
          <ChipSelect
            label="Current goal"
            value={draft.goal}
            options={GOALS}
            onChange={(v) => setDraft({ ...draft, goal: v })}
          />
        </div>

        <button
          onClick={save}
          className="press w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-semibold inline-flex items-center justify-center gap-2"
        >
          {saved ? "Saved ✓" : <><Save className="h-4 w-4" /> Save changes</>}
        </button>

        {p?.updated_at && (
          <p className="text-center text-[11px] text-muted-foreground">
            Updated {new Date(p.updated_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-muted rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm"
      />
    </label>
  );
}

function ChipSelect({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o === value ? "" : o)}
            className={`press text-xs font-medium px-3 py-1.5 rounded-full ${
              o === value ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
