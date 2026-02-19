import { supabase } from "../../lib/supabase";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../states/useAuthStore";
import { useActivePlanStore } from "../../states/activeplan";

export function useAuthCheck() {
  const navigate = useNavigate();
  const setUserId = useUserStore((s) => s.setUserId);
  const clearUser = useUserStore((s) => s.clearUser);
  const setActivePlanId = useActivePlanStore((s) => s.setId);
  const setActivePlanName = useActivePlanStore((s) => s.setName);
 
  
  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        clearUser();
        navigate("/login", { replace: true });
        return;
      }

     
      setUserId(session.user.id);
      // Fetch active plan for the user
      const { data, error: planError } = await supabase
        .from("workout_plan")
        .select("id, name")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (planError) {
        console.error("Error fetching active workout plan:", planError);
      } else if (data && data.length > 0) {
        setActivePlanId(data[0].id);
        setActivePlanName(data[0].name);
      }
    };

    check();
  }, [navigate, setUserId, clearUser, setActivePlanId, setActivePlanName]);
}
