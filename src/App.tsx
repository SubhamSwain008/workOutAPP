import Login from "./auth/login/login"
import { Route, Routes, Navigate } from "react-router-dom"
import Home from "./pages/home/Home"
import Profile from "./pages/Profile/profile"
import Workout from "./pages/workout/workout"
import Volume_LoadAndAI from "./pages/analyticsAndAi/intensityAnalytics"
import { ProtectedRoute, PublicRoute } from "./auth/RouteGuards"
import WorkoutHistory from "./pages/workoutHistory/history"

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workout"
          element={
            <ProtectedRoute>
              <Workout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Volume_Load-analytics"
          element={
            <ProtectedRoute>
              <Volume_LoadAndAI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workout-history"
          element={
            <ProtectedRoute>
              <WorkoutHistory />
            </ProtectedRoute>
          }
        />
      </Routes> 
    </div>
  )
}

export default App
