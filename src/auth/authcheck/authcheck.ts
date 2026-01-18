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
        .single();

      if (planError) {
        console.error("Error fetching active workout plan:", planError);
      } else if (data) {
        setActivePlanId(data.id);
        setActivePlanName(data.name);
      }
    };

    check();
  }, [navigate, setUserId, clearUser, setActivePlanId, setActivePlanName]);
}
