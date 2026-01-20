import Navbar from "../../components/navbar/navbar";
import WorkOutPlan from "../../components/workout_plan/Workout_plan";
import RightSection from "./rightSection";

export default function Home() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto px-4 py-8">
                <div className="flex-1">
                    <WorkOutPlan />
                </div>
                <div className="flex-1 flex items-start">
                    <RightSection />
                </div>
            </div>
        </div>
    );
}