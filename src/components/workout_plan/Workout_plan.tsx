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


    return (<>
        WorkOutPlan
        {loading ? <p>Loading...</p> : (<ul>
            workouts
            {workoutPlans.map((plan) => {
                const isEditing = editingPlanId === plan.id;

                return (
                    <li key={plan.id}>
                        {!isEditing ? (
                            <>
                                <h3>{plan.name}</h3>
                                <p>Split Type: {plan.split_type}</p>
                                <p>Days per Week: {plan.days_per_week}</p>
                                <p>Status: {plan.is_active ? "Active" : "Inactive"}</p>
                                <button
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
                            </>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    placeholder="Plan name"
                                    value={planName}
                                    onChange={(e) => setPlanName(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Split type"
                                    value={splitType}
                                    onChange={(e) => setSplitType(e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Days per week"
                                    value={daysPerWeek}
                                    onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                                />
                                <select
                                    value={isActive ? "true" : "false"}
                                    onChange={(e) => setIsActive(e.target.value === "true")}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                                <button onClick={updatePlan}>Confirm edit</button>
                                <button onClick={() => setEditingPlanId(null)}>Cancel</button>
                            </>
                        )}
                    </li>
                );
            })}

            <button onClick={() => setAddPlan(true)}>Add New Plan</button>

        </ul>

        )}
        {isPlan &&
            <div>

                <input type="text" placeholder="plan name" value={planName} onChange={(e) => setPlanName(e.target.value)} />
                <input type="text" placeholder="split type" value={splitType} onChange={(e) => setSplitType(e.target.value)} />
                <input type="number" placeholder="days per week" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))} />
                <div>set active</div>
                <select value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>

                <button onClick={addPlan}>Confirm Add Plan</button>

            </div>
        }

    </>)
}