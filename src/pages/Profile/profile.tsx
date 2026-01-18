import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../models/profile";
import ProfileCard from "./profileCard";
export default function Profile() {
    const navigate = useNavigate();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSession = async () => {
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (error) {
                console.error(error);
            }

            setSession(session);
            setLoading(false);
        };

        loadSession();
    }, []);

    useEffect(() => {
        if (!loading && !session) {
            navigate("/login");
        }
    }, [loading, session, navigate]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>Profile</h1>
            <ProfileCard />
            <p>Email: {session?.user.email}</p>
            <button onClick={() => navigate("/home")}>Home</button>
        </div>
    );
}
