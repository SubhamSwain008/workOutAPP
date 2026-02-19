import type { WorkoutPlan } from "../../models/workout_plan"
import { useAuthCheck } from "../../auth/authcheck/authcheck"
import { useEffect, useState } from "react"
import { Edit3, Plus, Check, X, CheckCircle, Circle, Sparkles, Calendar, Activity, Dumbbell, Flame, Trophy } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../states/useAuthStore";
import { useActivePlanStore } from "../../states/activeplan";
import WORKOUT_SPLITS from "../../lib/workoutSplits";
export default function WorkOutPlan() {

    useAuthCheck();
    const navigate = useNavigate();
    const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isPlan, setAddPlan] = useState<boolean>(false);
    const [planName, setPlanName] = useState<WorkoutPlan["name"]>("");
    const [splitType, setSplitType] = useState<string[]>([]);
    const [showSplitSuggestions, setShowSplitSuggestions] = useState(false);
    const [daysPerWeek, setDaysPerWeek] = useState<WorkoutPlan["days_per_week"]>();
    const [isActive, setIsActive] = useState<WorkoutPlan["is_active"]>(true);
    const [updateplanId, setUpdatePlanId] = useState<WorkoutPlan["id"]>();
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

    const userId = useUserStore((s) => s.userId);

    useEffect(() => {
        if (!userId) return;

        const fetchPlans = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from("workout_plan")
                .select("id, name, split_type, days_per_week, is_active")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching workout plans:", error);
                alert("Error fetching workout plans");
                navigate("/login");
            } else {
                // ensure active plans appear first in the list
                const sorted = (data ?? []).slice().sort((a, b) => Number(b.is_active) - Number(a.is_active));
                setWorkoutPlans(sorted);
                console.log(sorted);
            }

            setLoading(false);
        };

        fetchPlans();
    }, [userId]);

    const addPlan = async () => {
        if (!userId) return;

        if (!planName || !splitType || !daysPerWeek) {
            alert("Please fill all fields");
            return;
        }
        if (isActive) {
            //set all other plans to inactive
            const { data, error } = await supabase
                .from("workout_plan")
                .update({ is_active: false })
                .eq("user_id", userId)
                .eq("is_active", true);

            if (error) {
                console.error("Error updating workout plans:", error);
                alert("Error updating workout plans");
                console.log(data);
                return;
            }
        }

        const { data, error } = await supabase
            .from("workout_plan")
            .insert({
                user_id: userId,
                name: planName,
                split_type: splitType,
                days_per_week: daysPerWeek,
                is_active: isActive,
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding workout plan:", error);
        } else {
            // reflect DB changes immediately in local state
            if (data?.is_active) {
                setWorkoutPlans((prevPlans) => [data, ...prevPlans.map((p) => ({ ...p, is_active: false }))]);
            } else {
                setWorkoutPlans((prevPlans) => [data, ...prevPlans]);
            }

            // close modal and reset inputs
            setAddPlan(false);
            setPlanName("");
            setSplitType([]);
            setDaysPerWeek(undefined);
            setIsActive(true);

            // if the added plan is active, update active plan store so UI reacts
            if (data?.is_active) {
                const s = useActivePlanStore.getState();
                if (s.setId) s.setId(data.id);
                if (s.setName) s.setName(data.name);
                if (s.setSplitType) s.setSplitType(data.split_type);
                if (s.setDaysPerWeek) s.setDaysPerWeek(data.days_per_week);
                if (s.setIsActive) s.setIsActive(data.is_active);
            }
        }
    }

    const updatePlan = async () => {
        if (!userId || !updateplanId) return;

        if (!planName || !splitType || !daysPerWeek) {
            alert("Please fill all fields");
            return;
        }

        if (isActive) {
            await supabase
                .from("workout_plan")
                .update({ is_active: false })
                .eq("user_id", userId)
                .neq("id", updateplanId);
        }

        const { data, error } = await supabase
            .from("workout_plan")
            .update({
                name: planName,
                split_type: splitType,
                days_per_week: daysPerWeek,
                is_active: isActive,
            })
            .eq("id", updateplanId)
            .select()
            .single();

        if (error) {
            console.error(error);
            return;
        }

        // if this plan is set active, move it to the top and mark others inactive locally
        if (data?.is_active) {
            setWorkoutPlans((prev) => [
                data,
                ...prev.filter((p) => p.id !== data.id).map((p) => ({ ...p, is_active: false })),
            ]);
        } else {
            setWorkoutPlans((prev) => prev.map((p) => (p.id === data.id ? data : p)));
        }

        setEditingPlanId(null);
        setUpdatePlanId(undefined);
        // if updated plan is active, update active plan store so UI reacts
        if (data?.is_active) {
            const s = useActivePlanStore.getState();
            if (s.setId) s.setId(data.id);
            if (s.setName) s.setName(data.name);
            if (s.setSplitType) s.setSplitType(data.split_type);
            if (s.setDaysPerWeek) s.setDaysPerWeek(data.days_per_week);
            if (s.setIsActive) s.setIsActive(data.is_active);
        }

    };


    return (
        <section className="bg-card text-foreground rounded-2xl sm:rounded-3xl shadow-lg border border-border w-full max-w-2xl mx-auto overflow-hidden animate-[workout-fade-in_0.4s_ease-out_both]">
            {/* Header with gym vibe */}
            <div className="bg-linear-to-br from-primary/15 via-primary/5 to-transparent px-4 sm:px-6 py-4 sm:py-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-primary/20">
                        <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-primary" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-foreground">Workout Plans</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">Manage your splits & active plan</p>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="p-3 rounded-xl bg-primary/10">
                            <Flame className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                        <span className="text-sm text-muted-foreground">Loading plans…</span>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {workoutPlans.map((plan) => {
                            const isEditing = editingPlanId === plan.id;
                            return (
                                <li
                                    key={plan.id}
                                    className={`
                                        rounded-xl border transition-all duration-200 overflow-hidden
                                        ${plan.is_active
                                            ? "bg-primary/5 border-primary/30 shadow-sm"
                                            : "bg-background/80 border-border hover:border-border/80"
                                        }
                                    `}
                                >
                                    {!isEditing ? (
                                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                                            <div className="shrink-0 p-2 rounded-lg bg-muted/50">
                                                {plan.is_active ? (
                                                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                                ) : (
                                                    <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">{plan.name}</h3>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${plan.is_active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                                        {plan.is_active ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                                                        {plan.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                                                    {Array.isArray(plan.split_type) ? plan.split_type.join(' / ') : plan.split_type}
                                                </p>
                                                <p className="text-xs text-muted-foreground/80 mt-0.5">
                                                    <span className="font-medium text-foreground/90">{plan.days_per_week}</span> days/week
                                                </p>
                                            </div>
                                            <button
                                                className="shrink-0 min-h-[36px] px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted/50 active:scale-[0.98] transition flex items-center gap-1.5 touch-manipulation"
                                                onClick={() => {
                                                    setEditingPlanId(plan.id);
                                                    setUpdatePlanId(plan.id);
                                                    setPlanName(plan.name);
                                                    setSplitType(Array.isArray(plan.split_type) ? plan.split_type : []);
                                                    setDaysPerWeek(plan.days_per_week);
                                                    setIsActive(plan.is_active);
                                                }}
                                                aria-label="Edit plan"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                <span className="hidden sm:inline">Edit</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-3 sm:p-4 space-y-3 border-t border-border/50 bg-muted/20">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="relative sm:col-span-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Plan name"
                                                        className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                        value={planName}
                                                        onChange={(e) => { setPlanName(e.target.value); setShowSplitSuggestions(true); }}
                                                        onFocus={() => setShowSplitSuggestions(true)}
                                                        onBlur={() => setTimeout(() => setShowSplitSuggestions(false), 150)}
                                                    />
                                                    {showSplitSuggestions && (
                                                        <ul className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-44 overflow-auto z-50 text-sm custom-scrollbar">
                                                            {planName && (
                                                                <li className="px-3 py-2 hover:bg-primary/10 cursor-pointer border-b border-border/50" onMouseDown={(ev) => { ev.preventDefault(); setShowSplitSuggestions(false); }}>
                                                                    <span className="font-medium text-primary">Use &quot;{planName}&quot;</span>
                                                                </li>
                                                            )}
                                                            {WORKOUT_SPLITS.filter(s => !planName || s.name.toLowerCase().includes(planName.toLowerCase()) || s.splitType.some(t => t.toLowerCase().includes(planName.toLowerCase()))).slice(0, 15).map((s) => (
                                                                <li key={s.name} className="px-3 py-2 hover:bg-primary/10 cursor-pointer border-b border-border/50 last:border-0" onMouseDown={(ev) => { ev.preventDefault(); setPlanName(s.name); setSplitType(s.splitType); setShowSplitSuggestions(false); }}>
                                                                    <span className="font-medium">{s.name}</span>
                                                                    <span className="text-muted-foreground text-xs ml-1">— {s.splitType.join(' / ')}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Split (e.g. push / pull / legs)"
                                                    className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm"
                                                    value={splitType.join(' / ')}
                                                    onChange={(e) => setSplitType(e.target.value.split('/').map(s => s.trim().replace(/[^a-zA-Z0-9\s]/g, '')).filter(Boolean))}
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Days"
                                                        min={1}
                                                        max={7}
                                                        className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm"
                                                        value={daysPerWeek ?? ''}
                                                        onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                                                    />
                                                    <select
                                                        className="h-10 px-3 rounded-lg bg-background border border-border text-sm min-w-[100px]"
                                                        value={isActive ? "true" : "false"}
                                                        onChange={(e) => setIsActive(e.target.value === "true")}
                                                    >
                                                        <option value="true">Active</option>
                                                        <option value="false">Inactive</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition"
                                                    onClick={updatePlan}
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Save
                                                </button>
                                                <button
                                                    className="flex-1 h-9 rounded-lg border border-border bg-background text-foreground text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-muted/50 active:scale-[0.98] transition"
                                                    onClick={() => setEditingPlanId(null)}
                                                >
                                                    <X className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                        <li>
                            <button
                                className="w-full min-h-[44px] py-3 rounded-xl border-2 border-dashed border-primary/40 text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary/60 active:scale-[0.99] transition touch-manipulation"
                                onClick={() => setAddPlan(true)}
                            >
                                <Plus className="w-5 h-5" strokeWidth={2} />
                                Add New Plan
                            </button>
                        </li>
                    </ul>
                )}
            </div>
            {isPlan && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-[workout-fade-in_0.2s_ease-out_both]"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setAddPlan(false);
                            setPlanName("");
                            setSplitType([]);
                            setDaysPerWeek(undefined);
                            setIsActive(true);
                        }
                    }}
                >
                    <div className="bg-card text-foreground rounded-2xl sm:rounded-3xl shadow-2xl border border-border/50 w-full max-w-lg animate-[workout-scale-in_0.3s_ease-out_both] overflow-hidden">
                        {/* Header */}
                        <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5 sm:px-8 sm:py-6 border-b border-border/50">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2.5 rounded-xl bg-primary/20">
                                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" strokeWidth={2} />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-foreground">Add New Plan</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 ml-[52px] sm:ml-[60px]">
                                Create a new workout plan to track your progress
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-6 sm:p-8 space-y-5">
                            {/* Plan Name Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-primary" />
                                    Plan Name
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="e.g., ULPPL, Push/Pull/Legs, or custom name"
                                        className="w-full min-h-[44px] h-12 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition touch-manipulation"
                                        value={planName} 
                                        onChange={(e) => { setPlanName(e.target.value); setShowSplitSuggestions(true); }} 
                                        onFocus={() => setShowSplitSuggestions(true)} 
                                        onBlur={() => setTimeout(() => setShowSplitSuggestions(false), 150)} 
                                    />
                                    {showSplitSuggestions && (
                                        <ul className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-auto z-50 animate-[workout-fade-in_0.2s_ease-out_both] custom-scrollbar">
                                            {planName && (
                                                <li
                                                    className="px-4 py-3 hover:bg-primary/10 cursor-pointer text-sm text-foreground border-b border-border/50 transition-colors"
                                                    onMouseDown={(ev) => { ev.preventDefault(); setShowSplitSuggestions(false); }}
                                                >
                                                    <div className="font-semibold text-primary flex items-center gap-2">
                                                        <Check className="w-4 h-4" />
                                                        Use custom plan: "{planName}"
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">Enter your own split type below</div>
                                                </li>
                                            )}
                                            {WORKOUT_SPLITS
                                                .filter(s => {
                                                    if (!planName) return true;
                                                    const q = planName.toLowerCase();
                                                    return s.name.toLowerCase().includes(q) || s.splitType.some(t => t.toLowerCase().includes(q));
                                                })
                                                .slice(0, 20)
                                                .map((s) => (
                                                    <li 
                                                        key={s.name} 
                                                        className="px-4 py-3 hover:bg-primary/10 cursor-pointer text-sm text-foreground transition-colors border-b border-border/50 last:border-0" 
                                                        onMouseDown={(ev) => { ev.preventDefault(); setPlanName(s.name); setSplitType(s.splitType); setShowSplitSuggestions(false); }}
                                                    >
                                                        <div className="font-semibold text-foreground">{s.name}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">{s.splitType.join(' / ')}</div>
                                                    </li>
                                                ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Split Type Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    Split Type
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., upper / lower / push / pull / legs"
                                    className="w-full min-h-[44px] h-12 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition touch-manipulation"
                                    value={splitType.join(' / ')} 
                                    onChange={(e) => setSplitType(e.target.value.split('/').map(s => s.trim().replace(/[^a-zA-Z0-9\s]/g, '')).filter(s => s))} 
                                />
                                <p className="text-xs text-muted-foreground">Separate muscle groups with " / "</p>
                            </div>

                            {/* Days Per Week Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    Days Per Week
                                </label>
                                <input 
                                    type="number" 
                                    placeholder="e.g., 5"
                                    min="1"
                                    max="7"
                                    className="w-full min-h-[44px] h-12 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition touch-manipulation"
                                    value={daysPerWeek || ''} 
                                    onChange={(e) => setDaysPerWeek(Number(e.target.value))} 
                                />
                            </div>

                            {/* Active Status */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                    Status
                                </label>
                                <select 
                                    className="w-full min-h-[44px] h-12 px-4 rounded-xl bg-background border border-border text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition touch-manipulation cursor-pointer"
                                    value={isActive ? "true" : "false"} 
                                    onChange={(e) => setIsActive(e.target.value === "true")}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    Active plans will be set as your current workout plan
                                </p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 sm:px-8 sm:py-5 bg-muted/30 border-t border-border/50 flex flex-col sm:flex-row gap-3">
                            <button 
                                className="
                                    flex-1 min-h-[44px] h-12 px-6 rounded-xl
                                    bg-primary text-primary-foreground
                                    text-sm sm:text-base font-semibold
                                    hover:opacity-90 active:scale-[0.98]
                                    transition-all duration-200
                                    flex items-center justify-center gap-2
                                    touch-manipulation
                                    shadow-lg hover:shadow-xl
                                " 
                                onClick={addPlan}
                            >
                                <Check className="w-5 h-5" strokeWidth={2.5} />
                                <span>Create Plan</span>
                            </button>
                            <button 
                                className="
                                    flex-1 min-h-[44px] h-12 px-6 rounded-xl
                                    bg-background border border-border text-foreground
                                    text-sm sm:text-base font-semibold
                                    hover:bg-muted active:scale-[0.98]
                                    transition-all duration-200
                                    flex items-center justify-center gap-2
                                    touch-manipulation
                                " 
                                onClick={() => {
                                    setAddPlan(false);
                                    setPlanName("");
                                    setSplitType([]);
                                    setDaysPerWeek(undefined);
                                    setIsActive(true);
                                }}
                            >
                                <X className="w-5 h-5" strokeWidth={2.5} />
                                <span>Cancel</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}