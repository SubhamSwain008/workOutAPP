import ProfileCard from "./profileCard";
import Navbar from "../../components/navbar/navbar";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { LogOut, AlertCircle } from "lucide-react";

export default function Profile() {
    const navigate = useNavigate();
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Sign out failed:", error.message);
            // Still navigate — local session is likely already cleared
        }
        navigate("/login");
    };
    return (
        <div className="min-h-dvh bg-background pb-6 sm:pb-8 pb-[env(safe-area-inset-bottom)]">
            <Navbar />
            <ProfileCard />
            
            {/* Logout Section - Properly positioned */}
            <div className="max-w-4xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6">
                <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                                    <AlertCircle className="w-5 h-5 text-destructive" strokeWidth={2} />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">
                                        Account Actions
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        Sign out of your account on this device
                                    </p>
                                </div>
                            </div>
                            <button
                                className="w-full sm:w-auto min-h-[44px] h-11 px-6 rounded-xl bg-destructive/10 hover:bg-destructive/20 border-2 border-destructive/30 hover:border-destructive/50 text-destructive font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] touch-manipulation shadow-sm hover:shadow-md"
                                onClick={handleLogout}
                                aria-label="Log out"
                            >
                                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
