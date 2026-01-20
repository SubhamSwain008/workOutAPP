import type { WorkoutPlan } from "../../models/workout_plan"
import { useAuthCheck } from "../../auth/authcheck/authcheck"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../states/useAuthStore";
export default function WorkOutPlan() {

    useAuthCheck();
    const navigate = useNavigate();
    const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isPlan, setAddPlan] = useState<boolean>(false);
    const [planName, setPlanName] = useState<WorkoutPlan["name"]>("");
    const [splitType, setSplitType] = useState<WorkoutPlan["split_type"]>("");
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
                setWorkoutPlans(data ?? []);
                console.log(data);
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
            setWorkoutPlans((prevPlans) => [data, ...prevPlans]);
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

        setWorkoutPlans((prev) =>
            prev.map((p) => (p.id === data.id ? data : p))
        );

        setEditingPlanId(null);
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
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-primary">{plan.name}</h3>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${plan.is_active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{plan.is_active ? "Active" : "Inactive"}</span>
                                        </div>
                                        <p className="text-sm">Split Type: <span className="font-medium text-primary">{plan.split_type}</span></p>
                                        <p className="text-sm">Days per Week: <span className="font-medium">{plan.days_per_week}</span></p>
                                        <button
                                            className="btn btn-outline btn-sm mt-2 w-fit text-secondary"
                                            onClick={() => {
                                                setEditingPlanId(plan.id);
                                                setUpdatePlanId(plan.id);
                                                setPlanName(plan.name);
                                                setSplitType(plan.split_type);
                                                setDaysPerWeek(plan.days_per_week);
                                                setIsActive(plan.is_active);
                                            }}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="text"
                                            placeholder="Plan name"
                                            className="input input-bordered input-sm"
                                            value={planName}
                                            onChange={(e) => setPlanName(e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Split type"
                                            className="input input-bordered input-sm text-primary"
                                            value={splitType}
                                            onChange={(e) => setSplitType(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Days per week"
                                            className="input input-bordered input-sm"
                                            value={daysPerWeek}
                                            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                                        />
                                        <select
                                            className="select select-bordered select-sm"
                                            value={isActive ? "true" : "false"}
                                            onChange={(e) => setIsActive(e.target.value === "true")}
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                        <div className="flex gap-2 mt-1">
                                            <button className="btn btn-primary btn-sm" onClick={updatePlan}>Confirm</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingPlanId(null)}>Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                    <li>
                        <button className="btn btn-accent w-full mt-2" onClick={() => setAddPlan(true)}>Add New Plan</button>
                    </li>
                </ul>
            )}
            {isPlan && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-card text-foreground rounded-xl shadow-lg p-6 border border-border w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4 text-primary">Add New Plan</h3>
                        <div className="flex flex-col gap-3">
                            <input type="text" placeholder="Plan name" className="input input-bordered" value={planName} onChange={(e) => setPlanName(e.target.value)} />
                            <input type="text" placeholder="Split type" className="input input-bordered" value={splitType} onChange={(e) => setSplitType(e.target.value)} />
                            <input type="number" placeholder="Days per week" className="input input-bordered" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))} />
                            <div className="flex items-center gap-2">
                                <span>Set active:</span>
                                <select className="select select-bordered" value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")}>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button className="btn btn-primary w-full" onClick={addPlan}>Confirm Add Plan</button>
                                <button className="btn btn-ghost w-full" onClick={() => setAddPlan(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}