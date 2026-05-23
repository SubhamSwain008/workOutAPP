import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { TARGETED_MUSCLES, type TargetedMuscle } from "../lib/muscles.ts";

export default function MusclePicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? TARGETED_MUSCLES.filter((m) => m.label.toLowerCase().includes(q) || m.group.toLowerCase().includes(q))
      : TARGETED_MUSCLES;
    const byGroup = new Map<string, TargetedMuscle[]>();
    for (const m of filtered) {
      const arr = byGroup.get(m.group) ?? [];
      arr.push(m);
      byGroup.set(m.group, arr);
    }
    return Array.from(byGroup.entries());
  }, [query]);

  function toggle(k: string) {
    onChange(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k]);
  }

  return (
    <div className="p-4 space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search muscles…"
        className="w-full bg-muted rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="space-y-3 max-h-[55vh] overflow-y-auto thin-scrollbar">
        {groups.map(([group, items]) => (
          <div key={group}>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-1 mb-1.5">{group}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((m) => {
                const on = selected.includes(m.key);
                return (
                  <button
                    key={m.key}
                    onClick={() => toggle(m.key)}
                    className={`press inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border ${
                      on
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-foreground"
                    }`}
                  >
                    {on && <Check className="h-3 w-3" />}
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
