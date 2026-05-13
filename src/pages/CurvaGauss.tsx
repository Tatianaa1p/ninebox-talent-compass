import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, LogOut, Grid3x3, AlertTriangle, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGaussAccess } from '@/hooks/useGaussAccess';
import { useEmpresasQuery } from '@/hooks/queries/useEmpresasQuery';
import { useGaussData, EmpleadoGauss } from '@/hooks/queries/useGaussData';
import { GaussChart } from '@/components/GaussChart';
import GaussEmpleadosTableOptimized from '@/components/GaussEmpleadosTableOptimized';
import { GaussStats } from '@/components/GaussStats';
import { TalentAnalysisResult, type AnalisisData } from '@/components/TalentAnalysisResult';
import { calcularUmbrales, getPosicionPorPercentil } from '@/utils/gaussPercentiles';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const exportGaussExcel = (
  empleados: EmpleadoGauss[],
  umbralBajo: number,
  umbralAlto: number
) => {
  const data = empleados.map((e) => {
    const { label } = getPosicionPorPercentil(e.performance, umbralBajo, umbralAlto);
    return {
      Nombre: e.nombre,
      Empresa: e.empresaNombre,
      Equipo: e.equipoNombre,
      Tablero: e.tableroNombre,
      'Puntuación Desempeño': Number(e.performance.toFixed(2)),
      Potencial: Number(e.potencial.toFixed(2)),
      'Posición en Curva': label,
      'Umbral Bajo (P15)': Number(umbralBajo.toFixed(2)),
      'Umbral Alto (P85)': Number(umbralAlto.toFixed(2)),
      'Cuadrante Nine Box': e.cuadrante,
    };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length, 18) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Curva Gauss');
  XLSX.writeFile(wb, `curva_gauss_${new Date().toISOString().split('T')[0]}.xlsx`);
};

const CurvaGauss = () => {
  const navigate = useNavigate();
  const { signOut, loading: authLoading } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useGaussAccess();

  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [selectedEquipo, setSelectedEquipo] = useState<string>('todos');

  const { data: empresas = [] } = useEmpresasQuery(hasAccess);
  const { data: empleadosRaw = [], isLoading } = useGaussData(selectedEmpresa || null);

  const equiposDisponibles = useMemo(
    () => Array.from(new Set(empleadosRaw.map((e) => e.equipoNombre).filter(Boolean))).sort(),
    [empleadosRaw]
  );

  const empleados = useMemo(
    () =>
      selectedEquipo === 'todos'
        ? empleadosRaw
        : empleadosRaw.filter((e) => e.equipoNombre === selectedEquipo),
    [empleadosRaw, selectedEquipo]
  );

  const scores = useMemo(() => empleados.map((e) => e.performance), [empleados]);
  const umbrales = useMemo(() => calcularUmbrales(scores), [scores]);

  const counts = useMemo(() => {
    const { umbralBajo, umbralAlto } = umbrales;
    let bajo = 0, esperado = 0, alto = 0;
    empleados.forEach((e) => {
      if (e.performance <= umbralBajo) bajo++;
      else if (e.performance >= umbralAlto) alto++;
      else esperado++;
    });
    return { bajo, esperado, alto };
  }, [empleados, umbrales]);

  const [analisisGauss, setAnalisisGauss] = useState<AnalisisData | null>(null);
  const [analizando, setAnalizando] = useState(false);

  useEffect(() => {
    setAnalisisGauss(null);
  }, [selectedEmpresa, selectedEquipo]);

  useEffect(() => {
    const isFullyLoaded = !authLoading && !accessLoading;
    if (isFullyLoaded && !hasAccess) navigate('/acceso-denegado');
  }, [hasAccess, accessLoading, authLoading, navigate]);

  const handleAnalizarGauss = async () => {
    if (empleados.length < 10) return;
    setAnalizando(true);
    setAnalisisGauss(null);
    try {
      const { umbralBajo: p15, umbralAlto: p85, mean } = umbrales;
      const total = empleados.length;
      const bajoPct = ((counts.bajo / total) * 100).toFixed(1);
      const altoPct = ((counts.alto / total) * 100).toFixed(1);
      const esperadoPct = (100 - parseFloat(bajoPct) - parseFloat(altoPct)).toFixed(1);

      const porEquipo = empleados.reduce((acc, emp) => {
        const k = emp.equipoNombre || 'Sin equipo';
        if (!acc[k]) acc[k] = { total: 0, alto: 0, bajo: 0, scores: [] as number[] };
        acc[k].total++;
        acc[k].scores.push(emp.performance);
        if (emp.performance >= p85) acc[k].alto++;
        if (emp.performance <= p15) acc[k].bajo++;
        return acc;
      }, {} as Record<string, { total: number; alto: number; bajo: number; scores: number[] }>);

      const resumenEquipos = Object.entries(porEquipo).map(([equipo, d]) => ({
        equipo,
        total: d.total,
        pct_alto: ((d.alto / d.total) * 100).toFixed(0),
        pct_bajo: ((d.bajo / d.total) * 100).toFixed(0),
        promedio: (d.scores.reduce((a, b) => a + b, 0) / d.scores.length).toFixed(2),
      }));

      const empresaNombre = empresas.find((e) => e.id === selectedEmpresa)?.nombre || '';

      const { data, error } = await supabase.functions.invoke('analizar-curva-gauss', {
        body: { empresa: empresaNombre, total, mean, p15, p85, bajoPct, esperadoPct, altoPct, resumenEquipos },
      });
      if (error) throw error;
      const texto = (data?.analisis ?? '').trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(texto) as AnalisisData;
      setAnalisisGauss(parsed);
    } catch (err) {
      console.error('Error al analizar:', err);
      toast.error('No se pudo generar el análisis');
    } finally {
      setAnalizando(false);
    }
  };

  const handleExportExcel = () => {
    if (empleados.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    exportGaussExcel(empleados, umbrales.umbralBajo, umbrales.umbralAlto);
    toast.success('Reporte descargado correctamente');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading || accessLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/seidor-logo.png" alt="Seidor" className="h-6 md:h-8 w-auto object-contain" />
            <div className="w-px h-8 bg-border" />
            <h1 className="text-2xl font-bold">Curva de Gauss - Calibración de Competencias</h1>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Grid3x3 className="mr-2 h-4 w-4" />
                  Cambiar Módulo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>Ninebox Talent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/curva-gauss')}>Curva de Gauss</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/talent-management')}>Gestión de Talento</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/consolidated-ninebox')}>Nine Box Consolidado</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-end">
          <Button onClick={handleExportExcel} variant="outline" disabled={empleados.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Descargar reporte en Excel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Empresa / País</label>
            <Select value={selectedEmpresa} onValueChange={(v) => { setSelectedEmpresa(v); setSelectedEquipo('todos'); }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Equipo (opcional)</label>
            <Select value={selectedEquipo} onValueChange={setSelectedEquipo} disabled={!selectedEmpresa}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los equipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los equipos</SelectItem>
                {equiposDisponibles.map((eq) => (
                  <SelectItem key={eq} value={eq}>
                    {eq}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedEmpresa ? (
          <div className="border rounded-lg p-12 bg-card text-center text-muted-foreground">
            Seleccioná una empresa para ver la curva
          </div>
        ) : isLoading ? (
          <div className="border rounded-lg p-12 bg-card text-center text-muted-foreground">
            Cargando datos...
          </div>
        ) : (
          <>
            {empleados.length > 0 && empleados.length < 10 && (
              <div className="flex items-start gap-2 border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-900 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <span>Se necesitan más datos para una curva estadísticamente significativa (mínimo 10 empleados).</span>
              </div>
            )}

            <GaussStats
              umbrales={umbrales}
              countBajo={counts.bajo}
              countEsperado={counts.esperado}
              countAlto={counts.alto}
            />

            <div className="border rounded-lg p-4 bg-card">
              <GaussChart scores={scores} umbrales={umbrales} />
            </div>

            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-lg font-semibold">Análisis de distribución con IA</h3>
                  <p className="text-sm text-muted-foreground">
                    Diagnóstico de la curva de desempeño y recomendaciones para RRHH
                  </p>
                </div>
                <Button
                  onClick={handleAnalizarGauss}
                  disabled={analizando || empleados.length < 10}
                  variant={analisisGauss ? 'outline' : 'default'}
                >
                  {analizando ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analizando...</>
                  ) : analisisGauss ? (
                    <><RefreshCw className="mr-2 h-4 w-4" />Regenerar análisis</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Analizar distribución con IA</>
                  )}
                </Button>
              </div>

              {empleados.length === 0 && (
                <p className="text-sm text-muted-foreground">Seleccioná una empresa para habilitar el análisis.</p>
              )}
              {empleados.length > 0 && empleados.length < 10 && (
                <p className="text-sm text-muted-foreground">Se necesitan más datos para el análisis (mínimo 10 empleados).</p>
              )}
              {analizando && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analizando la distribución del desempeño...
                </div>
              )}
              {analisisGauss && !analizando && <TalentAnalysisResult data={analisisGauss} />}
            </Card>


            <GaussEmpleadosTableOptimized
              empleados={empleados}
              umbralBajo={umbrales.umbralBajo}
              umbralAlto={umbrales.umbralAlto}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default CurvaGauss;
