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
        <>
            <div>
                <Navbar />
                <LastDay />
                <AddPresentDay />
                {canStartWorkout && <AddSets />}
                <TodaysPastWorkouts />
                <SeePastWorkout />
            </div>
        </>
    );
}