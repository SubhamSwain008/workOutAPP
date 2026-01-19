import Login from "./auth/login/login"
import { Route,Routes ,Navigate} from "react-router-dom"
import Home from "./pages/home/Home"
import Profile from "./pages/Profile/profile"
import Workout from "./pages/workout/workout"
import IntensityAndAI from "./pages/analyticsAndAi/intensityAnalytics"
function App() {
  

  return (
   <>
    <Routes>
      <Route path="/login" element={<Login/>}/>
      <Route path="/home" element={<Home/>}/>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/profile" element={<Profile/>} />
      <Route path="/workout" element={<Workout/>} />
      <Route path="/intensity-analytics" element={<IntensityAndAI/>} />
    </Routes>
   </>
  )
}

export default App
