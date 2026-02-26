import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, supabaseUrl } from "../lib/supabase";
import { connectionStore, wakeUpSupabase } from "../lib/supabaseRetry";
import { useActivePlanStore } from "../states/activeplan";
import { useUserStore } from "../states/useAuthStore";

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    /** True when Supabase is being woken from cold sleep */
    waking: boolean;
    /** Non-null when all retries failed */
    connectionError: string | null;
    /** Manually retry the connection */
    retryConnection: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // Subscribe to the retry module's connection status
    const connectionStatus = useSyncExternalStore(
        connectionStore.subscribe,
        connectionStore.getSnapshot,
    );
    const waking = connectionStatus === "waking";

    const setUserId = useUserStore((s) => s.setUserId);
    const clearUser = useUserStore((s) => s.clearUser);
    const setActivePlanId = useActivePlanStore((s) => s.setId);
    const setActivePlanName = useActivePlanStore((s) => s.setName);
    const clearActivePlan = useActivePlanStore((s) => s.clear);

    const initSession = async () => {
        setLoading(true);
        setConnectionError(null);

        try {
            // 1. Wake Supabase if it's cold (retries internally)
            const isReachable = await wakeUpSupabase(supabaseUrl);
            if (!isReachable) {
                setConnectionError(
                    "Unable to reach the server. Please check your connection and try again.",
                );
                setLoading(false);
                return;
            }

            // 2. Now safe to fetch the session
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("getSession error:", error.message);
                // Non-fatal: user may simply not be logged in
            }

            const sess = data?.session ?? null;
            setSession(sess);

            if (sess) {
                setUserId(sess.user.id);
                fetchActivePlan(sess.user.id);
            } else {
                clearUser();
                clearActivePlan();
            }
        } catch (err) {
            console.error("AuthProvider init failed:", err);
            setConnectionError(
                "Unable to reach the server. Please check your connection and try again.",
            );
            clearUser();
            clearActivePlan();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initSession();

        // Listen for auth changes (works fine once connection is established)
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
            // If we were still in loading state, clear it
            setLoading(false);
        });

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const retryConnection = () => {
        initSession();
    };

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
        <AuthContext.Provider value={{
            session,
            user: session?.user ?? null,
            loading,
            waking,
            connectionError,
            retryConnection,
        }}>
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
