import Navbar from "../../components/navbar/navbar";
import WorkOutPlan from "../../components/workout_plan/Workout_plan";
import RightSection from "./rightSection";

export default function Home() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="flex flex-col gap-10 max-w-3xl mx-auto px-4 py-12 items-center">
                <div className="w-full max-w-xl">
                    <RightSection />
                </div>
                <div className="w-full max-w-2xl">
                    <WorkOutPlan />
                </div>
            </div>
        </div>
    );
}