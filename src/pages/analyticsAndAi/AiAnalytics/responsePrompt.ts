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
    console.log("Fetched profile data:", profileData);

    return `name :${profileData?.name} , age: ${profileData?.age}  , weight: ${profileData?.weight} , height: ${profileData?.height}` || "Unknown User";
    
}

async function getActivePlane() {
    const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('is_active', true)
        .single();

    if (error) {
        console.log("Error fetching active plan:", error.message);
        return "No Active Plan";
    }

    const splitType = Array.isArray(data?.split_type) ? data.split_type.join(' / ') : data?.split_type || '';
    return `${data?.name} days per week: ${data?.days_per_week} split type: ${splitType}` || "No Active Plan";
    
}



export  const promptInstruction= `Here is a sample prompt structure you can use to interact with the AI for analytics on workout data:
 Introduction:
   - return your answers inside 3 boxes
    <review> how good the workout plan is currently</review>
    <mistakes> point out any mistakes or inconsistencies in the workout data</mistakes>
    <suggestions> provide suggestions for improvement based on the data</suggestions>
 body description of user :
     ${await UserDeatils()}
     
 Active Workout Plan :
     ${await getActivePlane()}`