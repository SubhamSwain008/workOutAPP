import { supabase } from "../../lib/supabase"

export async function Token(): Promise<string | null> {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
        console.log("Error fetching session:", error.message)
        return null
    }

    return data.session?.access_token ?? null
}
