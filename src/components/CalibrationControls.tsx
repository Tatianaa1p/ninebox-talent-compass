import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ThresholdConfig {
  low: number;
  medium: number;
  high: number;
}

interface CalibrationControlsProps {
  performanceThresholds: ThresholdConfig;
  potentialThresholds: ThresholdConfig;
  onPerformanceChange: (thresholds: ThresholdConfig) => void;
  onPotentialChange: (thresholds: ThresholdConfig) => void;
  onReset: () => void;
}

export const CalibrationControls = ({
  performanceThresholds,
  potentialThresholds,
  onPerformanceChange,
  onPotentialChange,
  onReset,
}: CalibrationControlsProps) => {
  const { toast } = useToast();

  const handlePerformanceChange = (field: keyof ThresholdConfig, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onPerformanceChange({
        ...performanceThresholds,
        [field]: numValue,
      });
    }
  };

  const handlePotentialChange = (field: keyof ThresholdConfig, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onPotentialChange({
        ...potentialThresholds,
        [field]: numValue,
      });
    }
  };

  const handleExportConfig = () => {
    const config = {
      desempeño: {
        bajo: `≤ ${performanceThresholds.low}`,
        medio: `≥ ${performanceThresholds.medium} y < ${performanceThresholds.high}`,
        alto: `≥ ${performanceThresholds.high}`,
      },
      potencial: {
        bajo: `≤ ${potentialThresholds.low}`,
        medio: `≥ ${potentialThresholds.medium} y < ${potentialThresholds.high}`,
        alto: `≥ ${potentialThresholds.high}`,
      },
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `umbrales-nine-box-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuración exportada",
      description: "Los umbrales se han descargado correctamente",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Calibración de Umbrales</CardTitle>
            <CardDescription>
              Ajusta los rangos para recalcular la matriz automáticamente
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportConfig} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Config
            </Button>
            <Button onClick={onReset} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Performance Thresholds */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Umbrales de Desempeño</h3>
            
            <div className="space-y-2">
              <Label htmlFor="perf-low">
                Bajo (≤ valor)
              </Label>
              <Input
                id="perf-low"
                type="number"
                step="0.1"
                value={performanceThresholds.low}
                onChange={(e) => handlePerformanceChange("low", e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perf-medium">
                Medio (≥ valor y &lt; Alto)
              </Label>
              <Input
                id="perf-medium"
                type="number"
                step="0.1"
                value={performanceThresholds.medium}
                onChange={(e) => handlePerformanceChange("medium", e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perf-high">
                Alto (≥ valor)
              </Label>
              <Input
                id="perf-high"
                type="number"
                step="0.1"
                value={performanceThresholds.high}
                onChange={(e) => handlePerformanceChange("high", e.target.value)}
                className="w-full"
              />
            </div>

            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
              Ejemplo: Bajo ≤{performanceThresholds.low}, 
              Medio {performanceThresholds.medium}-{performanceThresholds.high - 0.1}, 
              Alto ≥{performanceThresholds.high}
            </div>
          </div>

          {/* Potential Thresholds */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Umbrales de Potencial</h3>
            
            <div className="space-y-2">
              <Label htmlFor="pot-low">
                Bajo (≤ valor)
              </Label>
              <Input
                id="pot-low"
                type="number"
                step="0.1"
                value={potentialThresholds.low}
                onChange={(e) => handlePotentialChange("low", e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pot-medium">
                Medio (≥ valor y &lt; Alto)
              </Label>
              <Input
                id="pot-medium"
                type="number"
                step="0.1"
                value={potentialThresholds.medium}
                onChange={(e) => handlePotentialChange("medium", e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pot-high">
                Alto (≥ valor)
              </Label>
              <Input
                id="pot-high"
                type="number"
                step="0.1"
                value={potentialThresholds.high}
                onChange={(e) => handlePotentialChange("high", e.target.value)}
                className="w-full"
              />
            </div>

            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
              Ejemplo: Bajo ≤{potentialThresholds.low}, 
              Medio {potentialThresholds.medium}-{potentialThresholds.high - 0.1}, 
              Alto ≥{potentialThresholds.high}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
