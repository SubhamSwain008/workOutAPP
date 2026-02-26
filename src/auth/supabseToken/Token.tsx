import { supabase } from "../../lib/supabase"

export async function Token(): Promise<string | null> {
    try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
            console.error("Error fetching session:", error.message)
            return null
        }

        return data.session?.access_token ?? null
    } catch (err) {
        console.error("Token fetch failed (network?):", err)
        return null
    }
}
