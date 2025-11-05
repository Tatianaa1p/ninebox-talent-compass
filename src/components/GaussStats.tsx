import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalibracionGauss } from '@/types/gauss';

interface GaussStatsProps {
  calibraciones: CalibracionGauss[];
}

export const GaussStats = ({ calibraciones }: GaussStatsProps) => {
  const totalPersonas = new Set(calibraciones.map(c => c.empleado_email)).size;
  
  const mediaActual = calibraciones.length > 0
    ? calibraciones.reduce((sum, c) => sum + c.score_calibrado, 0) / calibraciones.length
    : 0;

  const desviacionActual = calibraciones.length > 0
    ? Math.sqrt(
        calibraciones.reduce((sum, c) => sum + Math.pow(c.score_calibrado - mediaActual, 2), 0) / calibraciones.length
      )
    : 0;

  const ajuste = calibraciones.length > 0
    ? calibraciones.reduce((sum, c) => sum + Math.abs(c.score_calibrado - c.score_original), 0)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Personas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPersonas}</div>
          <p className="text-xs text-muted-foreground">
            {calibraciones.length} evaluaciones
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Media Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mediaActual.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Score promedio calibrado</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Desviación Estándar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{desviacionActual.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Dispersión de scores</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ajuste Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{ajuste.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Suma de diferencias absolutas</p>
        </CardContent>
      </Card>
    </div>
  );
};
