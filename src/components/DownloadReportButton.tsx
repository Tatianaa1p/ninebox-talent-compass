import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface DownloadReportButtonProps {
  tableroId: string;
  empresaId: string;
  empresaNombre: string;
  disabled?: boolean;
}

export const DownloadReportButton = ({ 
  tableroId, 
  empresaId, 
  empresaNombre,
  disabled 
}: DownloadReportButtonProps) => {
  const { toast } = useToast();
  const { canDownloadReports } = useUserPermissions();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!canDownloadReports()) {
      toast({
        title: "Permiso denegado",
        description: "No tienes permisos para descargar reportes",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('📥 Generando reporte para tablero:', tableroId, 'empresa:', empresaId);

      const { data, error } = await supabase.functions.invoke('generate-ninebox-report', {
        body: {
          tablero_id: tableroId,
          empresa_id: empresaId,
          empresa_nombre: empresaNombre,
        },
      });

      if (error) {
        console.error('Error al generar reporte:', error);
        throw error;
      }

      if (data?.signedUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = data.signedUrl;
        const extension = data.format || 'csv';
        link.download = `ninebox_${empresaNombre}_${new Date().toISOString().split('T')[0]}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "✅ Reporte descargado",
          description: `Reporte con ${data.employeeCount || 0} empleados generado correctamente`,
        });
      } else {
        throw new Error('No se recibió URL del reporte');
      }
    } catch (error: any) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error al descargar reporte",
        description: error.message || "No se pudo generar el reporte PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canDownloadReports()) {
    return null;
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || loading || !tableroId}
      variant="outline"
      size="sm"
    >
      <Download className="h-4 w-4 mr-2" />
      {loading ? "Generando..." : "Descargar Reporte"}
    </Button>
  );
};