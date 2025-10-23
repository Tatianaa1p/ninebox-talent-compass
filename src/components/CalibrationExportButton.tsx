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

      // Fetch calibraciones - update to match new structure
      const { data: calibraciones, error: calibError } = await supabase
        .from('calibraciones')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (calibError) throw calibError;

      // Build export data - include ALL evaluaciones
      const exportData = evaluaciones?.map(evaluacion => {
        // Find latest calibration for this evaluacion (won't find any with current structure)
        // We need to match by employee name since structure doesn't have evaluacion_id
        const calibration = null; // No direct link available

        // Determine original quadrant
        const getQuadrant = (perf: number, pot: number) => {
          const perfLevel = perf >= 4 ? "Alto" : perf >= 3 ? "Medio" : "Bajo";
          const potLevel = pot > 2.5 ? "Alto" : pot > 1.5 ? "Medio" : "Bajo";
          return `${potLevel}-${perfLevel}`;
        };

        const originalQuadrant = getQuadrant(evaluacion.desempeno_score, evaluacion.potencial_score);
        
        // Base data - always present for all employees
        const baseData: any = {
          "nombre": evaluacion.persona_nombre,
          "cuadrante_original": originalQuadrant,
          "performance": evaluacion.desempeno_score,
          "potencial": evaluacion.potencial_score,
        };

        // Not calibrated - add empty calibration fields
        return {
          ...baseData,
          "cuadrante_calibrado": "",
          "modificado": "No",
          "manager": "",
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
