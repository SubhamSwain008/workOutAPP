import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import { PublicOnly, RequireUser } from "./auth/RouteGuards.tsx";
import AppShell from "./components/AppShell.tsx";
import Welcome from "./pages/Welcome.tsx";
import Home from "./pages/Home.tsx";
import Workout from "./pages/Workout.tsx";
import History from "./pages/History.tsx";
import Stats from "./pages/Stats.tsx";
import Profile from "./pages/Profile.tsx";
import Settings from "./pages/Settings.tsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/welcome" element={<PublicOnly><Welcome /></PublicOnly>} />
        <Route path="/" element={<RequireUser><AppShell><Home /></AppShell></RequireUser>} />
        <Route path="/home" element={<RequireUser><AppShell><Home /></AppShell></RequireUser>} />
        <Route path="/workout" element={<RequireUser><AppShell><Workout /></AppShell></RequireUser>} />
        <Route path="/history" element={<RequireUser><AppShell><History /></AppShell></RequireUser>} />
        <Route path="/analytics" element={<RequireUser><AppShell><Stats /></AppShell></RequireUser>} />
        <Route path="/profile" element={<RequireUser><AppShell><Profile /></AppShell></RequireUser>} />
        <Route path="/settings" element={<RequireUser><AppShell><Settings /></AppShell></RequireUser>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}
