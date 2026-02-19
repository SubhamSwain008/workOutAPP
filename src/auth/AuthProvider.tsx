import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useActivePlanStore } from "../states/activeplan";
import { useUserStore } from "../states/useAuthStore";

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const setUserId = useUserStore((s) => s.setUserId);
    const clearUser = useUserStore((s) => s.clearUser);
    const setActivePlanId = useActivePlanStore((s) => s.setId);
    const setActivePlanName = useActivePlanStore((s) => s.setName);
    const clearActivePlan = useActivePlanStore((s) => s.clear);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                setUserId(session.user.id);
                fetchActivePlan(session.user.id);
            } else {
                clearUser();
                clearActivePlan();
            }
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                setUserId(session.user.id);
                fetchActivePlan(session.user.id);
            } else {
                clearUser();
                clearActivePlan();
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [setUserId, clearUser, setActivePlanId, setActivePlanName, clearActivePlan]);

    const fetchActivePlan = async (userId: string) => {
        const { data, error } = await supabase
            .from("workout_plan")
            .select("id, name")
            .eq("user_id", userId)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1);

        if (error) {
            console.error("Error fetching active workout plan:", error);
            clearActivePlan();
        } else if (data && data.length > 0) {
            setActivePlanId(data[0].id);
            setActivePlanName(data[0].name);
        } else {
            clearActivePlan();
        }
    };

    return (
        <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
