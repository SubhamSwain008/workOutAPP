import { useNavigate } from "react-router-dom";
import { Home, User, BarChart2, Clock, Sun, Moon } from "lucide-react";

import setColorTheme from "../../states/localSates/theme";
import { useEffect, useState } from "react";

export default function Navbar() {
    const navigate = useNavigate();
    const [currentTheme, setCurrentTheme] = useState<string | null>(localStorage.getItem("theme"));



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
                    <Home className="w-6 h-6" aria-hidden="true" />
                </li>
                <li
                    className="px-3 py-2 rounded-md hover:bg-secondary hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
                    onClick={() => navigate("/profile")}
                    title="Profile"
                >
                    <User className="w-6 h-6" aria-hidden="true" />
                </li>
                <li
                    className="px-3 py-2 rounded-md hover:bg-secondary hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
                    onClick={() => navigate("/Volume_Load-analytics")}
                    title="Volume Load Analytics"
                >
                    <BarChart2 className="w-6 h-6" aria-hidden="true" />
                </li>
                <li
                    className="px-3 py-2 rounded-md hover:bg-secondary hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
                    onClick={() => navigate("/workout-history")}
                    title="Workout History"
                >
                    <Clock className="w-6 h-6" aria-hidden="true" />
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
                    {currentTheme === "dark" ? (
                        <Sun className="w-6 h-6" aria-hidden="true" />
                    ) : (
                        <Moon className="w-6 h-6" aria-hidden="true" />
                    )}
                </li>
            </ul>
        </nav>
    );
}