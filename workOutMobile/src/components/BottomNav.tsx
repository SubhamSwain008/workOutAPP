import { NavLink, useNavigate } from "react-router-dom";
import { Dumbbell, Home, BarChart3, History, Settings } from "lucide-react";

const left = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/history", icon: History, label: "History" },
];
const right = [
  { to: "/analytics", icon: BarChart3, label: "Stats" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="relative max-w-md mx-auto px-4">
        <div
          className="rounded-t-[28px] border-x border-t border-border-2 shadow-lg"
          style={{ background: "var(--card)" }}
        >
          <div className="h-[var(--nav-height)] grid grid-cols-5 items-center px-2">
            {left.map(({ to, icon: Icon, label }) => (
              <NavItem key={to} to={to} icon={Icon} label={label} />
            ))}
            <div aria-hidden />
            {right.map(({ to, icon: Icon, label }) => (
              <NavItem key={to} to={to} icon={Icon} label={label} />
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate("/workout")}
          aria-label="Workout"
          className="press absolute left-1/2 -translate-x-1/2 grid place-items-center text-white"
          style={{
            top: `calc(-1 * var(--nav-fab) / 2 + 6px)`,
            height: "var(--nav-fab)",
            width: "var(--nav-fab)",
            borderRadius: "999px",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)",
            boxShadow: "0 12px 28px -6px color-mix(in srgb, var(--primary) 55%, transparent), 0 0 0 4px var(--background)",
          }}
        >
          <Dumbbell className="h-6 w-6" />
        </button>
      </div>
    </nav>
  );
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/home"}
      className={({ isActive }) =>
        `press relative flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-semibold tracking-wide ${
          isActive ? "text-primary" : "text-muted-foreground"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className="grid place-items-center rounded-xl transition-all"
            style={isActive
              ? { background: "color-mix(in srgb, var(--primary) 14%, transparent)", padding: "0.4rem 0.9rem" }
              : { padding: "0.4rem 0.6rem" }}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="leading-none">{label}</span>
        </>
      )}
    </NavLink>
  );
}
