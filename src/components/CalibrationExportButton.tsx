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

      // Fetch empleados
      let empleadosQuery = supabase.from('empleados').select('*');
      if (tableroId) {
        empleadosQuery = empleadosQuery.eq('tablero_id', tableroId);
      }
      const { data: empleados, error: empleadosError } = await empleadosQuery;
      if (empleadosError) throw empleadosError;

      // Fetch evaluaciones separately
      let evaluacionesQuery = supabase
        .from('evaluaciones')
        .select('id, persona_nombre, tablero_id, potencial_score_original, desempeno_score_original');
      if (tableroId) {
        evaluacionesQuery = evaluacionesQuery.eq('tablero_id', tableroId);
      }
      const { data: evaluaciones, error: evalError } = await evaluacionesQuery;
      if (evalError) throw evalError;

      // Fetch calibraciones for this tablero
      let calibracionesQuery = supabase
        .from('calibraciones')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tableroId) {
        calibracionesQuery = calibracionesQuery.eq('tablero_id', tableroId);
      }
      
      const { data: calibraciones, error: calibError } = await calibracionesQuery;
      if (calibError) throw calibError;

      // Helper function to determine quadrant from scores
      const getQuadrant = (perf: number, pot: number) => {
        const perfLevel = perf >= 4 ? "Alto" : perf >= 3 ? "Medio" : "Bajo";
        const potLevel = pot > 2.5 ? "Alto" : pot > 1.5 ? "Medio" : "Bajo";
        return `${potLevel}-${perfLevel}`;
      };

      // Build export data - include ALL empleados
      const exportData = empleados?.map(empleado => {
        // Find latest calibration for this empleado
        const calibration = calibraciones?.find(c => c.empleado_id === empleado.id);

        // Find evaluacion by matching nombre
        const evaluacion = evaluaciones?.find(e => e.persona_nombre === empleado.nombre && e.tablero_id === empleado.tablero_id);
        const originalPerf = evaluacion?.desempeno_score_original ?? empleado.performance ?? 0;
        const originalPot = evaluacion?.potencial_score_original ?? empleado.potencial ?? 0;
        const originalQuadrant = getQuadrant(originalPerf, originalPot);
        
        // Base data - always present for all employees
        const baseData: any = {
          "nombre": empleado.nombre,
          "cuadrante_original": originalQuadrant,
          "performance_original": originalPerf,
          "potencial_original": originalPot,
        };

        // If calibrated, add calibration data
        if (calibration) {
          const calibratedQuadrant = getQuadrant(calibration.performance_score, calibration.potential_score);
          return {
            ...baseData,
            "performance_calibrado": calibration.performance_score,
            "potencial_calibrado": calibration.potential_score,
            "cuadrante_calibrado": calibratedQuadrant,
            "modificado": "Sí",
            "calibrado_por": calibration.calibrado_por || "",
            "fecha": new Date(calibration.created_at || "").toLocaleDateString('es-ES'),
          };
        }

        // Not calibrated - add empty calibration fields
        return {
          ...baseData,
          "performance_calibrado": "",
          "potencial_calibrado": "",
          "cuadrante_calibrado": "",
          "modificado": "No",
          "calibrado_por": "",
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
