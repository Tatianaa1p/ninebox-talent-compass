import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Employee, PerformanceLevel, PotentialLevel } from "@/types/employee";
import { useToast } from "@/hooks/use-toast";
import { useOverrides } from "@/contexts/OverrideContext";
import { QUADRANT_KEYS, QUADRANT_NAMES } from "@/types/override";
import { useMemo } from "react";

interface ExportButtonProps {
  employees: Employee[];
}

export const ExportButton = ({ employees }: ExportButtonProps) => {
  const { toast } = useToast();
  const { getOverride } = useOverrides();

  const handleExport = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Prepare data for export with original and calibrated columns
      const exportData = employees.map((emp) => {
        const override = getOverride(emp.name);
        
        // Original classification
        const originalQuadrantKey = `${emp.performance}-${emp.potential}`;
        const originalQuadrant = QUADRANT_NAMES[originalQuadrantKey as keyof typeof QUADRANT_NAMES];

        // Calibrated classification
        let calibratedPerformance: PerformanceLevel = emp.performance;
        let calibratedPotential: PotentialLevel = emp.potential;
        let calibratedQuadrant: string = originalQuadrant;
        let overrideMotivo = "";
        let overrideUsuario = "";
        let overrideFecha = "";

        if (override) {
          const quadrantKey = QUADRANT_KEYS[override.override_cuadrante as keyof typeof QUADRANT_KEYS];
          if (quadrantKey) {
            const [performance, potential] = quadrantKey.split("-") as [PerformanceLevel, PotentialLevel];
            
            calibratedPerformance = override.override_desempeno_categoria || performance;
            calibratedPotential = override.override_potencial_categoria || potential;
            calibratedQuadrant = override.override_cuadrante;
          }
          overrideMotivo = override.override_motivo || "";
          overrideUsuario = override.override_usuario || "";
          overrideFecha = override.override_fecha || "";
        }

        return {
          "Nombre completo": emp.name,
          Manager: emp.manager,
          "Desempeño_original (AG)": emp.performanceScore.toFixed(2),
          "Categoría_desempeño_original": emp.performance,
          "Potencial_original (R)": emp.potentialScore.toFixed(2),
          "Categoría_potencial_original": emp.potential,
          Cuadrante_original: originalQuadrant,
          "Categoría_desempeño_calibrada": calibratedPerformance,
          "Categoría_potencial_calibrada": calibratedPotential,
          Cuadrante_calibrado: calibratedQuadrant,
          Override_motivo: overrideMotivo,
          Override_usuario: overrideUsuario,
          Override_fecha: overrideFecha,
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Nine Box Grid");

      // Generate file
      XLSX.writeFile(wb, `nine-box-grid-${new Date().toISOString().split("T")[0]}.xlsx`);

      toast({
        title: "Exportación exitosa",
        description: "El archivo Excel ha sido descargado con datos originales y calibrados",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Exportar a Excel
    </Button>
  );
};
