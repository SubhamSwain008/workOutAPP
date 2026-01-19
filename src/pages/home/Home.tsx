import Navbar from "../../components/navbar/navbar";
import WorkOutPlan from "../../components/workout_plan/Workout_plan";
import RightSection from "./rightSection";

export default function Home() {
    return (
        <div>
            <Navbar />
            <WorkOutPlan />
            <RightSection />
        </div>
    );
}