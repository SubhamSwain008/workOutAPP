import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { WorkoutDay } from "../../models/workout_day";
import { useActivePlanStore } from "../../states/activeplan";

/* ---------- IST helpers ---------- */

function getISTDateKey(date: Date) {
  return date.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata"
  });
}

function isTodayIST(iso: string) {
  return (
    getISTDateKey(new Date(iso)) ===
    getISTDateKey(new Date())
  );
}

function formatToIST(dateString: string) {
  return new Date(dateString).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

/* ---------- Component ---------- */

export default function LastDay() {
  const [lastTrained, setLastTrained] =
    useState<WorkoutDay | null>(null);

  const activePlanId = useActivePlanStore((s) => s.id);
  const activeplanName = useActivePlanStore((s) => s.name);

  useEffect(() => {
    if (!activePlanId) return;

    const fetchLastTrained = async () => {
      const { data, error } = await supabase
        .from("workout_day")
        .select("*")
        .eq("plan_id", activePlanId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      // 🔥 pick the most recent workout NOT from today
      const last = data?.find(
        (w) => !isTodayIST(w.created_at)
      );

      setLastTrained(last ?? null);
    };

    fetchLastTrained();
  }, [activePlanId]);

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow border border-border p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-muted-foreground">Current plan:</span>
        <span className="font-bold text-primary text-base">{activeplanName || <span className='italic text-muted-foreground'>None</span>}</span>
      </div>

      <div className="text-base font-semibold text-primary mb-1">Last Trained</div>

      {lastTrained ? (
        <div className="flex flex-col gap-1 text-sm">
          <div><span className="font-medium text-muted-foreground">Day type:</span> <span className="text-foreground font-semibold">{Array.isArray(lastTrained.day_type_name) ? lastTrained.day_type_name.join(", ") : lastTrained.day_type_name}</span></div>
          <div><span className="font-medium text-muted-foreground">Day number:</span> <span className="text-foreground">{lastTrained.day_index}</span></div>
          <div><span className="font-medium text-muted-foreground">Date:</span> <span className="text-foreground">{formatToIST(lastTrained.created_at)}</span></div>
        </div>
      ) : (
        <div className="italic text-muted-foreground text-sm">No previous workout (today is the first)</div>
      )}
    </div>
  );
}
