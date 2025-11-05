import { useState } from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EmpleadoPromedio, forzarCurvaGauss } from '@/utils/gaussCalculations';
import { useUpdateCalibracionGauss } from '@/hooks/queries/useCalibracionGaussQuery';
import { useCalibracionGaussQuery } from '@/hooks/queries/useCalibracionGaussQuery';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ForzarCurvaDialogProps {
  empleados: EmpleadoPromedio[];
  mediaObjetivo: number;
  desviacionObjetivo: number;
}

export const ForzarCurvaDialog = ({ empleados, mediaObjetivo, desviacionObjetivo }: ForzarCurvaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState(mediaObjetivo);
  const [desviacion, setDesviacion] = useState(desviacionObjetivo);
  const { user } = useAuth();
  const { data: calibraciones = [] } = useCalibracionGaussQuery();
  const updateCalibracion = useUpdateCalibracionGauss();

  const handleForzarCurva = async () => {
    if (empleados.length === 0) {
      toast.error('No hay empleados para ajustar');
      return;
    }

    setLoading(true);

    try {
      // Calcular nuevos scores basados en la curva Gauss
      const ajustes = forzarCurvaGauss(empleados, media, desviacion);

      // Actualizar todos los registros de calibración
      const updatePromises: Promise<any>[] = [];

      ajustes.forEach((nuevoPromedio, email) => {
        // Encontrar todas las calibraciones de este empleado
        const calibracionesEmpleado = calibraciones.filter(
          cal => cal.empleado_email === email
        );

        // Actualizar proporcionalmente cada competencia
        calibracionesEmpleado.forEach(cal => {
          const empleado = empleados.find(e => e.empleado_email === email);
          if (!empleado) return;

          // Calcular factor de ajuste
          const factorAjuste = nuevoPromedio / empleado.puntuacion_desempeno;
          const nuevoScore = Math.max(1.0, Math.min(4.0, cal.score_calibrado * factorAjuste));

          updatePromises.push(
            new Promise((resolve, reject) => {
              updateCalibracion.mutate(
                {
                  id: cal.id,
                  score_calibrado: nuevoScore,
                  calibrador_email: user?.email || 'sistema',
                },
                {
                  onSuccess: resolve,
                  onError: reject,
                }
              );
            })
          );
        });
      });

      await Promise.all(updatePromises);

      toast.success(`✅ Curva forzada: ${ajustes.size} empleados ajustados`);
      setOpen(false);
    } catch (error) {
      console.error('Error forzando curva:', error);
      toast.error('Error al forzar la curva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default">
          <TrendingUp className="mr-2 h-4 w-4" />
          Forzar Curva
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Forzar Curva de Gauss
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción redistribuirá todos los scores calibrados para ajustarse a una curva de Gauss con los parámetros especificados.
            <br /><br />
            <strong>Se afectarán {empleados.length} empleados.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="media">Media Objetivo</Label>
            <Input
              id="media"
              type="number"
              step="0.1"
              min="1.0"
              max="4.0"
              value={media}
              onChange={(e) => setMedia(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="desviacion">Desviación Estándar Objetivo</Label>
            <Input
              id="desviacion"
              type="number"
              step="0.1"
              min="0.1"
              max="2.0"
              value={desviacion}
              onChange={(e) => setDesviacion(Number(e.target.value))}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleForzarCurva} disabled={loading}>
            {loading ? 'Procesando...' : 'Forzar Curva'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
