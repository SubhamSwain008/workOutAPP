import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import setColorTheme from "../../states/localSates/theme";
import { useEffect, useState } from "react";

export default function Navbar() {
    const navigate = useNavigate();
    const [currentTheme, setCurrentTheme] = useState<string | null>(localStorage.getItem("theme"));

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    useEffect(() => {
        setColorTheme();

    }, [currentTheme]);

    function ChangeTextTheme() {
        setCurrentTheme(localStorage.getItem("theme"));
    }

    return (
        <nav className="w-full shadow-md bg-background/80 backdrop-blur sticky top-0 z-50">
            <ul className="max-w-5xl mx-auto flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-background text-primary font-bold">
                <li
                    className="px-3 py-2 rounded-md hover:bg-secondary hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
                    onClick={() => navigate("/home")}
                    title="Home"
                >
                    {/* Home icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M0 12l9-9 9 9h-3v8a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H8v4a1 1 0 0 1-1 1H3v-8H3z" />
                    </svg>
                </li>
                <li
                    className="px-3 py-2 rounded-md hover:bg-secondary hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
                    onClick={() => navigate("/profile")}
                    title="Profile"
                >
                    {/* Profile icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                    </svg>
                </li>
                <li
                    className="px-3 py-2 rounded-md hover:bg-secondary hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
                    onClick={() => navigate("/Volume_Load-analytics")}
                    title="Volume Load Analytics"
                >
                    {/* Analytics icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 17h2v-7H3v7zm4 0h2v-4H7v4zm4 0h2v-10h-2v10zm4 0h2v-2h-2v2zm4 0h2v-13h-2v13z" />
                    </svg>
                </li>
                <li
                    className="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer flex items-center justify-center"
                    onClick={() => {
                        localStorage.setItem("theme", localStorage.getItem("theme") === "dark" ? "light" : "dark");
                        setColorTheme();
                        ChangeTextTheme();
                    }}
                    title="Toggle Theme"
                >
                    {/* Theme icon */}
                    {currentTheme === "dark" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm5.657 3.343a1 1 0 0 1 1.414 0l.707.707a1 1 0 1 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414zM21 11a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1zm-2.929 7.071a1 1 0 0 1 0-1.414l.707-.707a1 1 0 1 1 1.414 1.414l-.707.707a1 1 0 0 1-1.414 0zM12 19a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1zm-7.071-2.929a1 1 0 0 1 1.414 0l.707.707a1 1 0 1 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414zM4 12a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2H4zm2.343-5.657a1 1 0 0 1 0 1.414l-.707.707A1 1 0 1 1 4.222 7.05l.707-.707a1 1 0 0 1 1.414 0zM12 7a5 5 0 1 1 0 10A5 5 0 0 1 12 7z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M21 12.79A9 9 0 0 1 12.79 3a1 1 0 0 0-1.13 1.32A7 7 0 1 0 19.68 12.9a1 1 0 0 0 1.32-1.13z" />
                        </svg>
                    )}
                </li>
                <li
                    className="px-3 py-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer flex items-center justify-center"
                    onClick={handleLogout}
                    title="Logout"
                >
                    {/* Logout icon */}
                   <svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="currentColor"
  aria-hidden="true"
>
  <path d="M16 13v-2H8V8l-5 4 5 4v-3h8z" />
  <path d="M19 3H5c-1.1 0-2 .9-2 2v6h2V5h14v14H5v-6H3v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
</svg>

                </li>
            </ul>
        </nav>
    );
}