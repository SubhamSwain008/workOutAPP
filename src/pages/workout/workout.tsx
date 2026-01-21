import Navbar from "../../components/navbar/navbar";
import AddPresentDay from "./addPresentday";
import LastDay from "./lastDay";
import { useCanStartWorkoutStore } from "../../states/canStartWorkout";
import AddSets from "./addSets";
import TodaysPastWorkouts from "./pastWorkouts";
import SeePastWorkout from "./seePastWorkout";

export default function Workout() {
    const canStartWorkout = useCanStartWorkoutStore((s) => s.canStartWorkout);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="flex flex-col items-center px-2 py-8">
                <div className="w-full max-w-2xl bg-card rounded-xl shadow-lg border border-border p-6 flex flex-col gap-6">
                    <h1 className="text-2xl font-bold text-primary mb-2 text-center">Workout Session</h1>
                    <section className="bg-secondary rounded-lg p-4 border border-border">
                        <LastDay />
                    </section>
                    <section className="bg-secondary rounded-lg p-4 border border-border">
                        <AddPresentDay />
                    </section>
                    {canStartWorkout && (
                        <section className="bg-secondary rounded-lg p-4 border border-border">
                            <AddSets />
                        </section>
                    )}
                    <section className="bg-secondary rounded-lg p-4 border border-border">
                        <TodaysPastWorkouts />
                    </section>
                    <section className="bg-secondary rounded-lg p-4 border border-border">
                        <SeePastWorkout />
                    </section>
                </div>
            </main>
        </div>
    );
}