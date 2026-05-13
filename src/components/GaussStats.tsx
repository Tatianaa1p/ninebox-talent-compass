import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UmbralesGauss } from '@/utils/gaussPercentiles';

interface GaussStatsProps {
  umbrales: UmbralesGauss;
  countBajo: number;
  countEsperado: number;
  countAlto: number;
}

export const GaussStats = ({ umbrales, countBajo, countEsperado, countAlto }: GaussStatsProps) => {
  const { n, mean, stdDev, umbralBajo, umbralAlto, minScore, maxScore } = umbrales;
  const pct = (c: number) => (n > 0 ? (c / n) * 100 : 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{n}</div>
            <p className="text-xs text-muted-foreground">basado en datos reales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Media Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mean.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Puntuación promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Desviación Estándar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stdDev.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Dispersión real</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rango</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {n > 0 ? `${minScore.toFixed(2)} - ${maxScore.toFixed(2)}` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Mín - Máx</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bajo desempeño</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-1">
              score ≤ {umbralBajo.toFixed(2)} | percentil 15
            </p>
            <div className="text-2xl font-bold text-red-600">{countBajo}</div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{pct(countBajo).toFixed(1)}% actual</p>
              <p className="text-xs text-red-600 font-medium">ideal: 15%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Desempeño esperado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-1">
              {umbralBajo.toFixed(2)} - {umbralAlto.toFixed(2)}
            </p>
            <div className="text-2xl font-bold text-blue-600">{countEsperado}</div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{pct(countEsperado).toFixed(1)}% actual</p>
              <p className="text-xs text-blue-600 font-medium">ideal: 70%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alto desempeño</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-1">
              score ≥ {umbralAlto.toFixed(2)} | percentil 85
            </p>
            <div className="text-2xl font-bold text-green-600">{countAlto}</div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{pct(countAlto).toFixed(1)}% actual</p>
              <p className="text-xs text-green-600 font-medium">ideal: 15%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
