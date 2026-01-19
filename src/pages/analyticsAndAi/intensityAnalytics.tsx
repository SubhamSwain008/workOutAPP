import Navbar from "../../components/navbar/navbar";
import Volume_LoadAnalytics from "./Volume_Load";
import PlotVolume_Loads from "./plotVolume_loads";

export default function Volume_LoadAndAI() {
  return (
    <div>
      <Navbar />
      <h1>Volume_Load Analytics</h1>
      <PlotVolume_Loads />
      <Volume_LoadAnalytics />
      

    </div>
  );
}
