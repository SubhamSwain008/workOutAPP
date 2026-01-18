import { useActivePlanStore } from "../../states/activeplan";
import { useNavigate } from "react-router-dom";
export default function RightSection(){
    const navigate = useNavigate();
    const planId = useActivePlanStore((s)=>s.id);
    const planName = useActivePlanStore((s)=>s.name);
    console.log("Active Plan ID in RightSection:", planId);

    return(
        <div>
           <h1>
            start your workout plan: {planName ?? "No active plan found"}
           </h1>
           <button onClick={() => navigate("/workout")}>Start Workout</button>
        </div>
    )
}