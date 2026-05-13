import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import HRBPDashboard from "./pages/HRBPDashboard";
import CurvaGauss from "./pages/CurvaGauss";
import TalentManagement from "./pages/TalentManagement";
import AccesoDenegado from "./pages/AccesoDenegado";
import ConsolidatedNineBox from "./pages/ConsolidatedNineBox";
import MfaSetup from "./pages/MfaSetup";
import MfaVerify from "./pages/MfaVerify";
import NotFound from "./pages/NotFound";
import { MfaGuard } from "./components/MfaGuard";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/mfa-setup" element={<MfaSetup />} />
      <Route path="/mfa-verify" element={<MfaVerify />} />
      <Route path="/dashboard" element={<MfaGuard><Dashboard /></MfaGuard>} />
      <Route path="/hrbp" element={<MfaGuard><HRBPDashboard /></MfaGuard>} />
      <Route path="/curva-gauss" element={<MfaGuard><CurvaGauss /></MfaGuard>} />
      <Route path="/talent-management" element={<MfaGuard><TalentManagement /></MfaGuard>} />
      <Route path="/acceso-denegado" element={<AccesoDenegado />} />
      <Route path="/consolidated-ninebox" element={<MfaGuard><ConsolidatedNineBox /></MfaGuard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </TooltipProvider>
);

export default App;
