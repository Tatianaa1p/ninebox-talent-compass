import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmpleadoPromedio, calcularEstadisticas } from '@/utils/gaussCalculations';

interface GaussStatsProps {
  empleados: EmpleadoPromedio[];
}

export const GaussStats = ({ empleados }: GaussStatsProps) => {
  const totalPersonas = empleados.length;
  
  const puntuaciones = empleados.map(e => e.puntuacion_desempeno);
  const { media: mediaActual, desviacion: desviacionActual } = calcularEstadisticas(puntuaciones);

  const totalCompetenciasEvaluadas = empleados.reduce((sum, e) => sum + e.competencias.length, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPersonas}</div>
          <p className="text-xs text-muted-foreground">
            {totalCompetenciasEvaluadas} competencias evaluadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Media Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mediaActual.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Puntuación promedio</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Desviación Estándar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{desviacionActual.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Dispersión de puntuaciones</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Rango</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {puntuaciones.length > 0 
              ? `${Math.min(...puntuaciones).toFixed(2)} - ${Math.max(...puntuaciones).toFixed(2)}`
              : 'N/A'
            }
          </div>
          <p className="text-xs text-muted-foreground">Mín - Máx</p>
        </CardContent>
      </Card>
    </div>
  );
};
