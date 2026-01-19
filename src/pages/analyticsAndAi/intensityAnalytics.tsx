import { useAuthCheck } from "../../auth/authcheck/authcheck";
import Navbar from "../../components/navbar/navbar";
import { useUserStore } from "../../states/useAuthStore";
import IntensityAnalytics from "./intensity";

export default function IntensityAndAI() {
  useAuthCheck();
  const userID = useUserStore((s) => s.userId);

  return (
    <div>
      <Navbar />
      <h1>Intensity Analytics</h1>

      {userID ? (
        <IntensityAnalytics />
      ) : (
        <p>Loading user data…</p>
      )}
    </div>
  );
}
