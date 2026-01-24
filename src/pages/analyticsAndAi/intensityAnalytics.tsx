import { useState } from "react";
import Navbar from "../../components/navbar/navbar";
import Volume_LoadAnalytics from "./Volume_Load";
import PlotVolume_Loads from "./plotVolume_loads";
import AiAnalytics from "./AiAnalyticts";

export default function Volume_LoadAndAI() {
  const [tab, setTab] = useState<"volume" | "ai">("volume");
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

      <main className="px-4 py-6 md:py-10">
        <div className="w-full max-w-4xl mx-auto">
          <header className="mb-6">
            <div className="flex flex-col items-center">
              <h1 className="text-2xl md:text-3xl font-bold text-primary text-center">
                {tab === "volume" ? "Volume Load Analytics" : "AI Advance Analytics"}
              </h1>

             <div className="mt-3 inline-flex rounded-lg border border-border bg-secondary p-1">
  <button
    onClick={() => setTab("volume")}
    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors
      ${
        tab === "volume"
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
  >
    Volume Load
  </button>

  <button
    onClick={() => setTab("ai")}
    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors
      ${
        tab === "ai"
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
  >
    AI Analytics
  </button>
</div>


              <p className="text-center text-sm text-muted-foreground mt-2">
                {tab === "volume"
                  ? "Visualise volume and load patterns from your logged workouts."
                  : "Explore AI-driven advanced analytics and recommendations."}
              </p>
            </div>
          </header>

          {tab === "volume" ? (
            <section className="grid gap-6 md:grid-cols-2">
              <div className="bg-card rounded-lg border border-border p-0">
                <PlotVolume_Loads />
              </div>

              <div className="bg-card rounded-lg border border-border p-4">
                <Volume_LoadAnalytics />
              </div>
            </section>
          ) : (
            <section>
              <div className="bg-card rounded-lg border border-border p-4">
                <AiAnalytics />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
