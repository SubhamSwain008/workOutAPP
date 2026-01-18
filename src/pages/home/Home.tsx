import { useAuthCheck } from "../../auth/authcheck/authcheck";
import Navbar from "../../components/navbar/navbar";
import WorkOutPlan from "../../components/workout_plan/Workout_plan";
import RightSection from "./rightSection";
export default function Home(){
    

    
    useAuthCheck();
   

    return(
        <div>
            <Navbar/>
            <WorkOutPlan/>
            <RightSection/>
            
        </div>
    )
}