import Navbar from "../../components/navbar/navbar";
import WorkOutPlan from "../../components/workout_plan/Workout_plan";
import RightSection from "./rightSection";

export default function Home() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="flex flex-col gap-6 sm:gap-8 max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-10 pb-[env(safe-area-inset-bottom)] items-center">
                <div className="w-full max-w-xl">
                    <RightSection />
                </div>
                <div className="w-full max-w-2xl px-0 sm:px-1">
                    <WorkOutPlan />
                </div>
            </div>
        </div>
    );
}