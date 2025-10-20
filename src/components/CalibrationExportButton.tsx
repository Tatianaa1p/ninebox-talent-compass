import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface CalibrationExportButtonProps {
  tableroId?: string;
}

export const CalibrationExportButton = ({ tableroId }: CalibrationExportButtonProps) => {
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      toast({
        title: "Generando reporte",
        description: "Preparando datos de calibración...",
      });

      // Fetch evaluaciones
      let evaluacionesQuery = supabase
        .from('evaluaciones')
        .select('*');
      
      if (tableroId) {
        evaluacionesQuery = evaluacionesQuery.eq('tablero_id', tableroId);
      }

      const { data: evaluaciones, error: evalError } = await evaluacionesQuery;
      if (evalError) throw evalError;

      // Fetch calibraciones
      const { data: calibraciones, error: calibError } = await supabase
        .from('calibraciones')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (calibError) throw calibError;

      // Build export data - include ALL evaluaciones
      const exportData = evaluaciones?.map(evaluacion => {
        // Find latest calibration for this evaluacion
        const calibration = calibraciones?.find(c => c.evaluacion_id === evaluacion.id);

        // Determine original quadrant
        // Potencial: Bajo ≤1.5, Medio >1.5 hasta ≤2.5, Alto >2.5
        // Desempeño: Bajo <3, Medio ≥3 hasta <4, Alto ≥4
        const getQuadrant = (perf: number, pot: number) => {
          const perfLevel = perf >= 4 ? "Alto" : perf >= 3 ? "Medio" : "Bajo";
          const potLevel = pot > 2.5 ? "Alto" : pot > 1.5 ? "Medio" : "Bajo";
          return `${perfLevel}-${potLevel}`;
        };

        const originalQuadrant = getQuadrant(evaluacion.desempeno_score, evaluacion.potencial_score);
        
        // Base data - always present for all employees
        const baseData: any = {
          "nombre": evaluacion.persona_nombre,
          "cuadrante_original": originalQuadrant,
          "score_original_potencial": evaluacion.potencial_score,
          "score_original_desempeno": evaluacion.desempeno_score,
        };

        // If calibrated, add calibration data
        if (calibration) {
          const calibratedQuadrant = calibration.cuadrante_calibrado || originalQuadrant;
          return {
            ...baseData,
            "cuadrante_calibrado": calibratedQuadrant,
            "score_calibrado_potencial": calibration.score_calibrado_potencial,
            "score_calibrado_desempeno": calibration.score_calibrado_desempeno,
            "modificado": "Sí",
            "fecha": new Date(calibration.created_at).toLocaleDateString('es-ES'),
          };
        }

        // Not calibrated - add empty calibration fields
        return {
          ...baseData,
          "cuadrante_calibrado": "",
          "score_calibrado_potencial": "",
          "score_calibrado_desempeno": "",
          "modificado": "No",
          "fecha": "",
        };
      }) || [];

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Calibraciones");

      // Auto-size columns
      const maxWidth = 30;
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.min(
          maxWidth,
          Math.max(
            key.length,
            ...exportData.map(row => String(row[key as keyof typeof row] || "").length)
          )
        )
      }));
      worksheet['!cols'] = colWidths;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Reporte_Calibraciones_${timestamp}.xlsx`;

      // Download
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Reporte generado",
        description: `${filename} descargado exitosamente`,
      });
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Error al generar reporte",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Descargar Reporte Excel
    </Button>
  );
};
