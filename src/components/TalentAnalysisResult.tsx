import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';

export interface AnalisisData {
  estado_general: 'saludable' | 'atención' | 'crítico';
  resumen: string;
  pct_alto_potencial: number;
  pct_riesgo: number;
  equipos: Array<{ nombre: string; estado: 'verde' | 'amarillo' | 'rojo'; insight: string }>;
  fortalezas: string[];
  alertas: string[];
  recomendaciones: string[];
}

const ESTADO_CONFIG: Record<AnalisisData['estado_general'], { label: string; color: string }> = {
  saludable: { label: 'Saludable', color: 'bg-green-100 text-green-800 border-green-200' },
  'atención': { label: 'Requiere atención', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  crítico: { label: 'Crítico', color: 'bg-red-100 text-red-800 border-red-200' },
};

const EQUIPO_COLORS: Record<'verde' | 'amarillo' | 'rojo', string> = {
  verde: 'bg-green-100 text-green-800 border-green-200',
  amarillo: 'bg-amber-100 text-amber-800 border-amber-200',
  rojo: 'bg-red-100 text-red-800 border-red-200',
};

export const TalentAnalysisResult = ({ data }: { data: AnalisisData }) => {
  const estadoCfg = ESTADO_CONFIG[data.estado_general] ?? ESTADO_CONFIG['atención'];

  return (
    <div className="space-y-6">
      {/* Pills resumen */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={`${estadoCfg.color} text-xs font-medium`}>
          {estadoCfg.label}
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs font-medium inline-flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {data.pct_alto_potencial}% alto potencial
        </Badge>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs font-medium inline-flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {data.pct_riesgo}% en riesgo
        </Badge>
      </div>

      {/* Resumen ejecutivo */}
      <p className="text-base leading-relaxed text-foreground">{data.resumen}</p>

      {/* Chips por equipo */}
      {data.equipos?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Por equipo</h4>
          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              {data.equipos.map((eq, i) => (
                <Tooltip key={`${eq.nombre}-${i}`}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={`${EQUIPO_COLORS[eq.estado] ?? EQUIPO_COLORS.amarillo} cursor-default text-xs font-medium`}
                    >
                      {eq.nombre}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">{eq.insight}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>
      )}

      {/* Fortalezas / Alertas / Recomendaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-green-50/50 border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-green-700" />
            <h4 className="font-semibold text-sm text-green-900">Fortalezas</h4>
          </div>
          <ul className="space-y-1.5">
            {data.fortalezas?.map((f, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-green-700">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 bg-amber-50/50 border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <h4 className="font-semibold text-sm text-amber-900">Alertas</h4>
          </div>
          <ul className="space-y-1.5">
            {data.alertas?.map((a, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-amber-700">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 bg-blue-50/50 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-blue-700" />
            <h4 className="font-semibold text-sm text-blue-900">Recomendaciones</h4>
          </div>
          <ul className="space-y-1.5">
            {data.recomendaciones?.map((r, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-blue-700 font-semibold">{i + 1}.</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};
