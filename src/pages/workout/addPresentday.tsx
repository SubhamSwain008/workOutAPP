import { useEffect, useState } from "react";
import { Play, Plus, ChevronRight, Zap, Clock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { WorkoutDay } from "../../models/workout_day";
import { useActivePlanStore } from "../../states/activeplan";
import { useAuthCheck } from "../../auth/authcheck/authcheck";
import { useCanStartWorkoutStore } from "../../states/canStartWorkout";

/* ---------- IST helpers ---------- */

function getISTDateKey(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
function getTodayISTKey() {
  return getISTDateKey(new Date());
}
function getISTKeyFromISOString(iso: string) {
  return getISTDateKey(new Date(iso));
}
function formatToIST(dateString: string) {
  return new Date(dateString).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDayType(val: unknown): string {
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.startsWith("[")) {
      try { const parsed = JSON.parse(trimmed); if (Array.isArray(parsed)) return parsed.join(", "); } catch { /* ignore */ }
    }
    return trimmed || "—";
  }
  return "—";
}

/* ---------- Component ---------- */

export default function AddPresentDay() {
  useAuthCheck();

  const activePlanId = useActivePlanStore((s) => s.id);
  const activePlanName = useActivePlanStore((s) => s.name);
  const setCanStartWorkout = useCanStartWorkoutStore((s) => s.setCanStartWorkout);

  const [previousWorkout, setPreviousWorkout] = useState<WorkoutDay | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<WorkoutDay | null>(null);
  const [canAddToday, setCanAddToday] = useState(true);
  const [loading, setLoading] = useState(true);

  const [existingDayTypes, setExistingDayTypes] = useState<string[]>([]);
  const [selectedDayType, setSelectedDayType] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [newDayType, setNewDayType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---------- Fetch data ---------- */
  useEffect(() => {
    if (!activePlanId) return;

    const fetchData = async () => {
      setLoading(true);

      const { data: planData, error: planError } = await supabase
        .from("workout_plan")
        .select("split_type")
        .eq("id", activePlanId)
        .single();

      if (planError) {
        console.error(planError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("workout_day")
        .select("*")
        .eq("plan_id", activePlanId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const todayIST = getTodayISTKey();
      const today = data?.find((w) => getISTKeyFromISOString(w.created_at) === todayIST);
      const previous = data?.find((w) => getISTKeyFromISOString(w.created_at) !== todayIST);

      setTodayWorkout(today ?? null);
      setPreviousWorkout(previous ?? null);

      const splitTypes = Array.isArray(planData?.split_type) ? planData.split_type : [];
      setExistingDayTypes(splitTypes);
      setSelectedDayType(splitTypes[0] ?? "");

      setCanAddToday(!today);
      setCanStartWorkout(!!today);
      setLoading(false);
    };

    fetchData();
  }, [activePlanId, setCanStartWorkout]);

  /* ---------- Insert ---------- */
  const handleAddTodayWorkout = async () => {
    if (!canAddToday || !activePlanId || isSubmitting) return;

    const dayType = showCustomInput ? newDayType.trim() : selectedDayType;
    if (!dayType) return;

    setIsSubmitting(true);

    const newWorkout = {
      id: crypto.randomUUID(),
      plan_id: activePlanId,
      day_index: (previousWorkout?.day_index ?? 0) + 1,
      day_type_name: [dayType],
      created_at: new Date().toISOString(),
    } as WorkoutDay;

    const { error } = await supabase.from("workout_day").insert(newWorkout);

    if (error) {
      console.error(error);
      setIsSubmitting(false);
      return;
    }

    setTodayWorkout(newWorkout);
    setCanAddToday(false);
    setCanStartWorkout(true);
    setIsSubmitting(false);
  };

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  /* --- Workout already started today --- */
  if (!canAddToday && todayWorkout) {
    return (
      <div className="animate-[workout-fade-in_0.4s_ease-out_both]">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-chart-1/10 via-chart-1/5 to-transparent border border-chart-1/20 p-5 sm:p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-chart-1/5 rounded-full blur-2xl -translate-y-8 translate-x-8" />

          <div className="relative flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-chart-1/15">
              <Zap className="w-5 h-5 text-chart-1" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Workout Active</h3>
              <p className="text-xs text-muted-foreground">
                Day {todayWorkout.day_index} &middot;{" "}
                <span className="text-chart-1 font-semibold">{formatDayType(todayWorkout.day_type_name)}</span>
              </p>
            </div>
          </div>

          {previousWorkout && (
            <div className="relative flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Last session:{" "}
                  <span className="font-medium text-foreground">{formatDayType(previousWorkout.day_type_name)}</span>{" "}
                &middot; {formatToIST(previousWorkout.created_at)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* --- Start new session --- */
  return (
    <div className="animate-[workout-slide-up_0.5s_ease-out_both]">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-chart-2/5 pointer-events-none" />

        <div className="relative p-5 sm:p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
              <Play className="w-7 h-7 text-primary ml-0.5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Start Today's Workout</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {activePlanName && (
                <span className="text-primary font-medium">{activePlanName}</span>
              )}
              {previousWorkout && (
                <>
                  {" "}&middot; Last:{" "}
                  <span className="font-medium">
                    {Array.isArray(previousWorkout.day_type_name) ? previousWorkout.day_type_name.join(", ") : previousWorkout.day_type_name}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Day type pill selector */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
              What are you training today?
            </label>

            <div className="flex flex-wrap gap-2">
              {existingDayTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedDayType(type);
                    setShowCustomInput(false);
                  }}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                    touch-manipulation active:scale-95 min-h-10
                    ${selectedDayType === type && !showCustomInput
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-2 ring-primary/30"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                    }
                  `}
                >
                  {type}
                </button>
              ))}

              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                  touch-manipulation active:scale-95 min-h-10
                  flex items-center gap-1.5
                  ${showCustomInput
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary border border-dashed border-border"
                  }
                `}
              >
                <Plus className="w-4 h-4" />
                Custom
              </button>
            </div>

            {showCustomInput && (
              <div className="mt-3 animate-[workout-fade-in_0.2s_ease-out_both]">
                <input
                  placeholder="e.g. Push, Pull, Upper, Legs..."
                  value={newDayType}
                  onChange={(e) => setNewDayType(e.target.value)}
                  autoFocus
                  className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                             transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            )}
          </div>

          {/* Start button */}
          <button
            onClick={handleAddTodayWorkout}
            disabled={isSubmitting || (!showCustomInput && !selectedDayType) || (showCustomInput && !newDayType.trim())}
            className="
              w-full h-12 sm:h-14 rounded-xl
              bg-linear-to-r from-primary to-primary/85
              text-primary-foreground text-base font-bold
              flex items-center justify-center gap-2
              shadow-lg shadow-primary/20
              hover:shadow-xl hover:shadow-primary/30 hover:from-primary/95 hover:to-primary/80
              active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
              transition-all duration-200 touch-manipulation
            "
          >
            {isSubmitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Session</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
