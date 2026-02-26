import { createClient } from "@supabase/supabase-js";
import { fetchWithRetry } from "./supabaseRetry";

export const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;

export const supabase = createClient(
  supabaseUrl,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  {
    global: {
      fetch: fetchWithRetry,
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);
