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
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <Routes>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/hrbp" element={<HRBPDashboard />} />
      <Route path="/curva-gauss" element={<CurvaGauss />} />
      <Route path="/talent-management" element={<TalentManagement />} />
      <Route path="/acceso-denegado" element={<AccesoDenegado />} />
      <Route path="/consolidated-ninebox" element={<ConsolidatedNineBox />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </TooltipProvider>
);

export default App;
