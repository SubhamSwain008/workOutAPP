import type { ReactNode } from "react";
import BottomNav from "./BottomNav.tsx";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-background text-foreground bg-noise">
      <main className="max-w-md mx-auto w-full pb-nav">{children}</main>
      <BottomNav />
    </div>
  );
}
