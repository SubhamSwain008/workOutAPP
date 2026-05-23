import { NavLink } from "react-router-dom";
import { Dumbbell, Home, BarChart3, History, Settings } from "lucide-react";

const items = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/workout", icon: Dumbbell, label: "Workout" },
  { to: "/history", icon: History, label: "History" },
  { to: "/analytics", icon: BarChart3, label: "Stats" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="max-w-md mx-auto px-2 grid grid-cols-5 h-[var(--nav-height)]">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/home"}
            className={({ isActive }) =>
              `press flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid place-items-center rounded-xl transition-all ${
                    isActive ? "bg-primary/12 px-4 py-1.5" : "py-1.5"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
