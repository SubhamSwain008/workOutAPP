import type { WorkoutPlan } from "../../models/workout_plan"
import { useAuthCheck } from "../../auth/authcheck/authcheck"
import { useEffect, useState } from "react"
import { Edit3, Plus, Check, X, CheckCircle, Circle } from "lucide-react";
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
        <section className="bg-card text-foreground rounded-xl shadow-md p-6 border border-border mt-6 w-full max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-primary mb-4">Workout Plans</h2>
            {loading ? (
                <div className="flex justify-center items-center h-24 text-lg text-primary">Loading...</div>
            ) : (
                <ul className="space-y-4">
                    {workoutPlans.map((plan) => {
                        const isEditing = editingPlanId === plan.id;
                        return (
                            <li key={plan.id} className="bg-background rounded-lg p-4 shadow border border-border">
                                {!isEditing ? (
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-semibold text-primary truncate">{plan.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">Split Type: <span className="font-medium text-primary">{Array.isArray(plan.split_type) ? plan.split_type.join(' / ') : plan.split_type}</span></p>
                                            <p className="text-sm text-muted-foreground">Days per Week: <span className="font-medium">{plan.days_per_week}</span></p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${plan.is_active ? "bg-primary text-white" : "bg-secondary text-gray-600"}`}>
                                                {plan.is_active ? <CheckCircle className="w-4 h-4 mr-2" /> : <Circle className="w-4 h-4 mr-2" />}
                                                {plan.is_active ? "Active" : "Inactive"}
                                            </span>
                                            <button
                                                className="btn btn-sm btn-outline w-20 flex items-center justify-center gap-2"
                                                onClick={() => {
                                                    setEditingPlanId(plan.id);
                                                    setUpdatePlanId(plan.id);
                                                    setPlanName(plan.name);
                                                    setSplitType(Array.isArray(plan.split_type) ? plan.split_type : []);
                                                    setDaysPerWeek(plan.days_per_week);
                                                    setIsActive(plan.is_active);
                                                }}
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                <span>Edit</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Plan name (search or enter custom)"
                                                className="input input-bordered input-sm w-full"
                                                value={planName}
                                                onChange={(e) => { setPlanName(e.target.value); setShowSplitSuggestions(true); }}
                                                onFocus={() => setShowSplitSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowSplitSuggestions(false), 150)}
                                            />
                                            {showSplitSuggestions && (
                                                <ul className="absolute left-0 right-0 bg-card border border-border rounded-md mt-1 max-h-40 overflow-auto shadow z-50">
                                                    {planName && (
                                                        <li
                                                            className="px-3 py-2 hover:bg-accent/10 cursor-pointer text-sm text-foreground border-b border-border"
                                                            onMouseDown={(ev) => { ev.preventDefault(); setShowSplitSuggestions(false); }}
                                                        >
                                                            <div className="font-medium text-accent">✓ Use custom plan: "{planName}"</div>
                                                            <div className="text-xs text-muted-foreground">Enter your own split type below</div>
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
                                                                className="px-3 py-2 hover:bg-accent/10 cursor-pointer text-sm text-foreground"
                                                                onMouseDown={(ev) => { ev.preventDefault(); setPlanName(s.name); setSplitType(s.splitType); setShowSplitSuggestions(false); }}
                                                            >
                                                                <div className="font-medium">{s.name}</div>
                                                                <div className="text-xs text-muted-foreground">{s.splitType.join(' / ')}</div>
                                                            </li>
                                                        ))}
                                                </ul>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Split type (auto-filled or enter custom)"
                                            className="input input-bordered input-sm text-primary w-full"
                                            value={splitType.join(' / ')}
                                            onChange={(e) => setSplitType(e.target.value.split('/').map(s => s.trim().replace(/[^a-zA-Z0-9\s]/g, '')).filter(s => s))}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Days per week"
                                            className="input input-bordered input-sm w-full"
                                            value={daysPerWeek}
                                            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                                        />
                                        <select
                                            className="select select-bordered select-sm w-full"
                                            value={isActive ? "true" : "false"}
                                            onChange={(e) => setIsActive(e.target.value === "true")}
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                        <div className="flex gap-2 mt-1">
                                            <button className="btn btn-primary btn-sm w-full" onClick={updatePlan}>Confirm</button>
                                            <button className="btn btn-ghost btn-sm w-full" onClick={() => setEditingPlanId(null)}>Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                    <li>
                        <button className="btn btn-accent w-full mt-2 flex items-center justify-center gap-2" onClick={() => setAddPlan(true)}>
                            <Plus className="w-4 h-4" />
                            Add New Plan
                        </button>
                    </li>
                </ul>
            )}
            {isPlan && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-card text-foreground rounded-xl shadow-lg p-6 border border-border w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 text-primary">Add New Plan</h3>
                        <div className="flex flex-col gap-3">
                            <div className="relative">
                                <input type="text" placeholder="Plan name (search or enter custom)" className="input input-bordered w-full" value={planName} onChange={(e) => { setPlanName(e.target.value); setShowSplitSuggestions(true); }} onFocus={() => setShowSplitSuggestions(true)} onBlur={() => setTimeout(() => setShowSplitSuggestions(false), 150)} />
                                {showSplitSuggestions && (
                                    <ul className="absolute left-0 right-0 bg-card border border-border rounded-md mt-1 max-h-40 overflow-auto shadow z-50">
                                        {planName && (
                                            <li
                                                className="px-3 py-2 hover:bg-accent/10 cursor-pointer text-sm text-foreground border-b border-border"
                                                onMouseDown={(ev) => { ev.preventDefault(); setShowSplitSuggestions(false); }}
                                            >
                                                <div className="font-medium text-accent">✓ Use custom plan: "{planName}"</div>
                                                <div className="text-xs text-muted-foreground">Enter your own split type below</div>
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
                                                <li key={s.name} className="px-3 py-2 hover:bg-accent/10 cursor-pointer text-sm text-foreground" onMouseDown={(ev) => { ev.preventDefault(); setPlanName(s.name); setSplitType(s.splitType); setShowSplitSuggestions(false); }}>
                                                    <div className="font-medium">{s.name}</div>
                                                    <div className="text-xs text-muted-foreground">{s.splitType.join(' / ')}</div>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                            <input type="text" placeholder="Split type (auto-filled or enter custom)" className="input input-bordered w-full" value={splitType.join(' / ')} onChange={(e) => setSplitType(e.target.value.split('/').map(s => s.trim().replace(/[^a-zA-Z0-9\s]/g, '')).filter(s => s))} />
                            <input type="number" placeholder="Days per week" className="input input-bordered w-full" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))} />
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Set active:</span>
                                <select className="select select-bordered" value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")}>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button className="btn btn-primary w-full flex items-center justify-center gap-2" onClick={addPlan}><Check className="w-4 h-4" />Confirm Add Plan</button>
                                <button className="btn btn-ghost w-full flex items-center justify-center gap-2" onClick={() => setAddPlan(false)}><X className="w-4 h-4" />Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}