import ProfileCard from "./profileCard";
import Navbar from "../../components/navbar/navbar";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function Profile() {
    const navigate = useNavigate();
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };
    return (
        <div>
            <Navbar />

            <ProfileCard />
            <div className="max-w-5xl mx-auto px-4 py-6" />

            <button
                className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 h-10 px-4 rounded-full bg-primary text-primary-foreground flex items-center gap-2 shadow-lg"
                onClick={handleLogout}
                aria-label="Log out"
            >
                <LogOut className="h-4 w-4" />
                Logout
            </button>

        </div>
    );
}
