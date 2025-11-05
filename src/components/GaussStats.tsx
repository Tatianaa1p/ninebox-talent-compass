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

  // Categorize employees by performance score according to ideal distribution
  const distribucion = empleados.reduce(
    (acc, emp) => {
      const score = emp.puntuacion_desempeno;
      if (score >= 3.0) acc.alto++;
      else if (score >= 2.0) acc.esperado++;
      else acc.bajo++;
      return acc;
    },
    { alto: 0, esperado: 0, bajo: 0 }
  );

  const porcentajes = {
    bajo: totalPersonas > 0 ? (distribucion.bajo / totalPersonas) * 100 : 0,
    esperado: totalPersonas > 0 ? (distribucion.esperado / totalPersonas) * 100 : 0,
    alto: totalPersonas > 0 ? (distribucion.alto / totalPersonas) * 100 : 0,
  };

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bajo desempeño (1 a &lt;2)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{distribucion.bajo}</div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {porcentajes.bajo.toFixed(1)}% actual
              </p>
              <p className="text-xs text-red-600 font-medium">
                ideal: 15%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Desempeño esperado (2 a &lt;3)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{distribucion.esperado}</div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {porcentajes.esperado.toFixed(1)}% actual
              </p>
              <p className="text-xs text-blue-600 font-medium">
                ideal: 75%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alto desempeño (3 a 4)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{distribucion.alto}</div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {porcentajes.alto.toFixed(1)}% actual
              </p>
              <p className="text-xs text-green-600 font-medium">
                ideal: 10%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
