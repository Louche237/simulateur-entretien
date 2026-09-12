import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/Auth/AuthPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Simulation from "./pages/Simulation/Simulation";
import Parametres from "./pages/Parametres/Parametres";
import Historique from "./pages/Historique/Historique";
import AnalyseCV from "./pages/AnalyseCV/AnalyseCV";
import CVBuilder from "./pages/CVBuilder/CVBuilder";
import Entrainements from "./pages/Entrainements/Entrainements";
import Entretien from "./pages/Entretien/Entretien";
import Admin from "./pages/Admin/Admin";
import AdminLoginPage from "./pages/Admin/AdminAuth/AdminLoginPage";
import AdminRegisterPage from "./pages/Admin/AdminAuth/AdminRegisterPage";
import ConfirmEmail from "./pages/ConfirmEmail/ConfirmEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Candidate Authentication */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />

        {/* Dedicated Admin Authentication */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/register" element={<AdminRegisterPage />} />

        {/* Candidate Protected Routes */}
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

        {/* Dedicated Admin Protected Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
