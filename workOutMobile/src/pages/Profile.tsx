import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";
import PageHeader from "../components/PageHeader.tsx";
import Avatar from "../components/Avatar.tsx";
import Chip from "../components/Chip.tsx";
import { useUserStore } from "../states/useUserStore.ts";
import { getProfile, upsertProfile } from "../db/repos/profile.ts";
import type { Profile as ProfileType } from "../models";

const GENDERS = ["male", "female", "other"];
const GOALS = ["hypertrophy", "strength", "fat loss", "endurance", "general fitness"];

function bmi(weightKg: number | null, heightCm: number | null): { v: number | null; cat: string; pct: number } {
  if (!weightKg || !heightCm) return { v: null, cat: "", pct: 0 };
  const m = heightCm / 100;
  const v = +(weightKg / (m * m)).toFixed(1);
  const cat = v < 18.5 ? "underweight" : v < 25 ? "healthy" : v < 30 ? "overweight" : "obese";
  // Normalize to 0..1 across [15, 35] for a visual gauge
  const pct = Math.max(0, Math.min(1, (v - 15) / 20));
  return { v, cat, pct };
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
    if ("vibrate" in navigator) navigator.vibrate?.(15);
    setTimeout(() => setSaved(false), 1500);
  }

  const w = draft.weight ? Number(draft.weight) : null;
  const h = draft.height ? Number(draft.height) : null;
  const { v: bmiV, cat: bmiCat, pct: bmiPct } = bmi(w, h);

  return (
    <div className="page-in">
      <PageHeader title="Profile" />
      <div className="px-5 space-y-4 stagger">
        {/* Header card with avatar */}
        <div className="surface-hero p-5 flex items-center gap-4">
          <Avatar name={draft.name || username} size={64} />
          <div className="relative z-10 flex-1 min-w-0">
            <p className="font-display font-extrabold text-xl tracking-tight truncate">{draft.name || username}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">@{username}</p>
            {draft.goal && <Chip variant="primary" className="mt-2 capitalize">{draft.goal}</Chip>}
          </div>
        </div>

        {bmiV && (
          <div className="surface p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">BMI</p>
                <p className="font-display text-display text-[34px] leading-none mt-1 tabular-nums">{bmiV}</p>
              </div>
              <Chip variant="primary" className="capitalize">{bmiCat}</Chip>
            </div>
            {/* Gauge */}
            <div className="mt-3 h-2 rounded-full bg-card-2 overflow-hidden relative">
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: "100%",
                  background: "linear-gradient(90deg, #60a5fa 0%, #34d399 25%, #fbbf24 50%, #fb7185 100%)",
                  opacity: 0.5,
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-4 w-1 rounded-full bg-foreground"
                style={{ left: `${bmiPct * 100}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[9.5px] uppercase tracking-wider text-muted-foreground font-semibold">
              <span>under</span><span>healthy</span><span>over</span><span>obese</span>
            </div>
          </div>
        )}

        <div className="surface p-4 space-y-3">
          <Field label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <div className="grid grid-cols-3 gap-2">
            <Field label="Age" value={draft.age} type="number" onChange={(v) => setDraft({ ...draft, age: v })} />
            <Field label="Height (cm)" value={draft.height} type="number" onChange={(v) => setDraft({ ...draft, height: v })} />
            <Field label="Weight (kg)" value={draft.weight} type="number" onChange={(v) => setDraft({ ...draft, weight: v })} />
          </div>
          <ChipSelect label="Gender" value={draft.gender} options={GENDERS} onChange={(v) => setDraft({ ...draft, gender: v })} />
          <ChipSelect label="Current goal" value={draft.goal} options={GOALS} onChange={(v) => setDraft({ ...draft, goal: v })} />
        </div>

        <button
          onClick={save}
          className="btn-primary press w-full py-3.5 inline-flex items-center justify-center gap-2"
        >
          {saved ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save changes</>}
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
      <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">{label}</span>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-card-2 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
      />
    </label>
  );
}

function ChipSelect({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground font-semibold">{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o === value ? "" : o)}
            className={`press text-xs font-semibold capitalize px-3 py-1.5 rounded-full ${
              o === value ? "text-primary-foreground" : "bg-card-2 text-foreground"
            }`}
            style={o === value ? { background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)" } : undefined}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
