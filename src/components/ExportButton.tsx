import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Employee } from "@/types/employee";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  employees: Employee[];
}

export const ExportButton = ({ employees }: ExportButtonProps) => {
  const { toast } = useToast();

  const handleExport = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Prepare data for export
      const exportData = employees.map((emp) => ({
        Nombre: emp.name,
        Manager: emp.manager,
        "Desempeño (Clasificación)": emp.performance,
        "Desempeño (Puntuación)": emp.performanceScore.toFixed(2),
        "Potencial (Clasificación)": emp.potential,
        "Potencial (Puntuación)": emp.potentialScore.toFixed(2),
        Cuadrante: `${emp.performance} Desempeño / ${emp.potential} Potencial`,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Nine Box Grid");

      // Generate file
      XLSX.writeFile(wb, `nine-box-grid-${new Date().toISOString().split("T")[0]}.xlsx`);

      toast({
        title: "Exportación exitosa",
        description: "El archivo Excel ha sido descargado",
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
