import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthPage from "./pages/Auth/AuthPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Simulation from "./pages/Simulation/Simulation";
import Parametres from "./pages/Parametres/Parametres";
import Historique from "./pages/Historique/Historique";
import AnalyseCV from "./pages/AnalyseCV/AnalyseCV";
import CVBuilder from "./pages/CVBuilder/CVBuilder";
import Entrainements from "./pages/Entrainements/Entrainements";
import Entretien from "./pages/Entretien/Entretien";
import ProtectedRoute from "./components/ProtectedRoute";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/entretien" element={<Entretien />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="/historique" element={<Historique />} />
          <Route path="/analyse-cv" element={<AnalyseCV />} />
          <Route path="/cv-builder" element={<CVBuilder />} />
          <Route path="/entrainements" element={<Entrainements />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
