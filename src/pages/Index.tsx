import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Employee, PerformanceLevel, PotentialLevel } from "@/types/employee";
import { InteractiveNineBoxGrid } from "@/components/InteractiveNineBoxGrid";
import { StatisticsPanel } from "@/components/StatisticsPanel";
import { FileUploader } from "@/components/FileUploader";
import { ExportButton } from "@/components/ExportButton";
import { CalibrationControls, ThresholdConfig } from "@/components/CalibrationControls";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { ClearOverridesButton } from "@/components/ClearOverridesButton";
import { parseExcelFiles, loadDefaultData, EmployeeRawData } from "@/utils/excelParser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  low: 2.4,
  medium: 2.5,
  high: 4.0,
};

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rawData, setRawData] = useState<EmployeeRawData[]>([]);
  const [unclassified, setUnclassified] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [performanceThresholds, setPerformanceThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [potentialThresholds, setPotentialThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const { toast } = useToast();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    } else if (!authLoading && !user) {
      // Allow staying on Index page for demo/testing
    }
  }, [user, authLoading, navigate]);

  // Recalculate employee classifications based on current thresholds
  const employees = useMemo(() => {
    const classifyLevel = (value: number, thresholds: ThresholdConfig): "Bajo" | "Medio" | "Alto" => {
      if (value >= thresholds.high) return "Alto";
      if (value >= thresholds.medium) return "Medio";
      return "Bajo";
    };

    return rawData.map((data) => ({
      id: `${data.name}-${Date.now()}-${Math.random()}`,
      name: data.name,
      manager: data.manager,
      performanceScore: data.performanceScore,
      potentialScore: data.potentialScore,
      performance: classifyLevel(data.performanceScore, performanceThresholds) as PerformanceLevel,
      potential: classifyLevel(data.potentialScore, potentialThresholds) as PotentialLevel,
    }));
  }, [rawData, performanceThresholds, potentialThresholds]);

  useEffect(() => {
    // Load default data on mount
    loadDefaultData()
      .then(({ rawData, unclassified }) => {
        setRawData(rawData);
        setUnclassified(unclassified);
        toast({
          title: "Datos cargados",
          description: `Se cargaron ${rawData.length} empleados exitosamente`,
        });
      })
      .catch((error) => {
        console.error("Error loading default data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos por defecto",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const handleFilesUploaded = async (performanceFile: File, potentialFile: File) => {
    setLoading(true);
    try {
      const { rawData, unclassified } = await parseExcelFiles(performanceFile, potentialFile);
      setRawData(rawData);
      setUnclassified(unclassified);
      toast({
        title: "Archivos cargados",
        description: `Se cargaron ${rawData.length} empleados exitosamente`,
      });
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Error",
        description: "Error al procesar los archivos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetThresholds = () => {
    setPerformanceThresholds(DEFAULT_THRESHOLDS);
    setPotentialThresholds(DEFAULT_THRESHOLDS);
    toast({
      title: "Umbrales restaurados",
      description: "Se han restaurado los valores por defecto",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Nine Box Grid - Evaluación de Talento
            </h1>
            <p className="text-muted-foreground">
              Matriz de evaluación de Desempeño vs Potencial
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={() => navigate('/auth')}>
              Iniciar Sesión / Registrarse
            </Button>
            <ClearOverridesButton />
            <ExportButton employees={employees} />
          </div>
        </div>

        {/* File Uploader */}
        <FileUploader onFilesUploaded={handleFilesUploaded} />

        {/* View Mode Toggle */}
        <ViewModeToggle />

        {/* Statistics */}
        <StatisticsPanel employees={employees} />

        {/* Calibration Controls */}
        <CalibrationControls
          performanceThresholds={performanceThresholds}
          potentialThresholds={potentialThresholds}
          onPerformanceChange={setPerformanceThresholds}
          onPotentialChange={setPotentialThresholds}
          onReset={handleResetThresholds}
        />

        {/* Nine Box Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Matriz Nine Box Interactiva</CardTitle>
            <CardDescription>
              Arrastra empleados entre cuadrantes para reclasificar manualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveNineBoxGrid employees={employees} />
          </CardContent>
        </Card>

        {/* Unclassified Cases */}
        {unclassified.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Casos sin clasificar ({unclassified.length})</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1">
                {unclassified.map((item, index) => (
                  <div key={index} className="text-sm">
                    • {item.name} - {item.reason}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default Index;
