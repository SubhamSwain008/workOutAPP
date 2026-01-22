import Navbar from "../../components/navbar/navbar";
import Volume_LoadAnalytics from "./Volume_Load";
import PlotVolume_Loads from "./plotVolume_loads";

export default function Volume_LoadAndAI() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Navbar />

      <main className="px-4 py-6 md:py-10">
        <div className="w-full max-w-4xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-primary text-center">
              Volume Load Analytics
            </h1>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Visualise volume and load patterns from your logged workouts.
            </p>
          </header>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="bg-card rounded-lg border border-border p-4">
              <PlotVolume_Loads />
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <Volume_LoadAnalytics />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
