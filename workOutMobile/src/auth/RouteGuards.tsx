import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useUserStore } from "../states/useUserStore.ts";

export function Loader() {
  return (
    <div className="min-h-dvh grid place-items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent spin" />
    </div>
  );
}

export function RequireUser({ children }: { children: ReactNode }) {
  const { userId, hydrated } = useUserStore();
  const location = useLocation();
  if (!hydrated) return <Loader />;
  if (!userId) return <Navigate to="/welcome" replace state={{ from: location }} />;
  return <>{children}</>;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { userId, hydrated } = useUserStore();
  if (!hydrated) return <Loader />;
  if (userId) return <Navigate to="/home" replace />;
  return <>{children}</>;
}
