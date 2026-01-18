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
    <div>
      <div>current plan: {activeplanName}</div>

      <div>Last Trained</div>

      {lastTrained ? (
        <div>
          <div>day type: {lastTrained.day_type_name}</div>
          <div>day number: {lastTrained.day_index}</div>
          <div>date: {formatToIST(lastTrained.created_at)}</div>
        </div>
      ) : (
        <div>No previous workout (today is the first)</div>
      )}
    </div>
  );
}
