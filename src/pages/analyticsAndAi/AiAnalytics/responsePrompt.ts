import { supabase } from "../../../lib/supabase"

async function UserDeatils(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        console.log("Error fetching user details:", error.message);
        return "Unknown User";
    }

    const user = data.user;
    if (!user) {
        return "Unknown User";
    }

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    if (profileError) {
        console.log("Error fetching profile data:", profileError.message);
        return user.email || "Unknown User";
    }

    const parts: string[] = [];
    if (profileData?.name) parts.push(`Name: ${profileData.name}`);
    if (profileData?.age) parts.push(`Age: ${profileData.age}`);
    if (profileData?.weight) parts.push(`Weight: ${profileData.weight} kg`);
    if (profileData?.height) parts.push(`Height: ${profileData.height} cm`);
    if (profileData?.gender) parts.push(`Gender: ${profileData.gender}`);
    if (profileData?.current_goal) parts.push(`Current Goal: ${profileData.current_goal}`);

    return parts.length > 0 ? parts.join(", ") : "Unknown User";
}

async function getActivePlane() {
    const { data, error } = await supabase
        .from('workout_plan')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) {
        console.log("Error fetching active plan:", error?.message);
        return "No Active Plan";
    }

    const plan = data[0];
    const splitType = Array.isArray(plan?.split_type) ? plan.split_type.join(' / ') : plan?.split_type || '';
    return `Plan: ${plan?.name}, Days per week: ${plan?.days_per_week}, Split type: ${splitType}`;
}



export  const promptInstruction= `Here is a sample prompt structure you can use to interact with the AI for analytics on workout data:
 Introduction:
   - return your answers inside 3 boxes
    <review> how good the workout plan is currently</review>
    <mistakes> point out any mistakes or inconsistencies in the workout data , only the mistakes realted to workout not date formating etc.</mistakes>
    <suggestions> provide suggestions for improvement based on the data</suggestions>
 User Profile (use this for personalized recommendations):
     ${await UserDeatils()}
     
 Active Workout Plan :
     ${await getActivePlane()}`