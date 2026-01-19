import Login from "./auth/login/login"
import { Route, Routes, Navigate } from "react-router-dom"
import Home from "./pages/home/Home"
import Profile from "./pages/Profile/profile"
import Workout from "./pages/workout/workout"
import IntensityAndAI from "./pages/analyticsAndAi/intensityAnalytics"
import { ProtectedRoute, PublicRoute } from "./auth/RouteGuards"

function App() {
  return (
    <>
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
          path="/intensity-analytics"
          element={
            <ProtectedRoute>
              <IntensityAndAI />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App
