import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  AlertTriangle,
  Grid3x3,
  LogOut,
  Minus,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useEmpresasQuery } from '@/hooks/queries/useEmpresasQuery';
import { useConsolidatedNineBox } from '@/hooks/queries/useConsolidatedNineBox';
import { DownloadNineBoxImageButton } from '@/components/DownloadNineBoxImageButton';

const QUADRANT_LAYOUT: Array<{
  id: string;
  title: string;
  color: string;
}> = [
  { id: 'Alto-Bajo', title: 'Enigma', color: 'bg-medium' },
  { id: 'Alto-Medio', title: 'Desarrollar', color: 'bg-high' },
  { id: 'Alto-Alto', title: 'Talento Estratégico', color: 'bg-high' },
  { id: 'Medio-Bajo', title: 'Dilema', color: 'bg-low' },
  { id: 'Medio-Medio', title: 'Clave', color: 'bg-medium' },
  { id: 'Medio-Alto', title: 'Consistente', color: 'bg-high' },
  { id: 'Bajo-Bajo', title: 'Riesgo', color: 'bg-low' },
  { id: 'Bajo-Medio', title: 'Estancamiento', color: 'bg-low' },
  { id: 'Bajo-Alto', title: 'Confiable', color: 'bg-medium' },
];

const HIGH_KEYS = ['Alto-Alto', 'Alto-Medio', 'Medio-Alto'];
const MID_KEYS = ['Alto-Bajo', 'Medio-Medio', 'Bajo-Alto'];
const LOW_KEYS = ['Medio-Bajo', 'Bajo-Medio', 'Bajo-Bajo'];

const truncate = (s: string, n = 20) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

const ConsolidatedNineBox = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { permissions, loading: permissionsLoading, hasAccess } = useUserPermissions();

  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');
  const [analisis, setAnalisis] = useState('');
  const [analizando, setAnalizando] = useState(false);
  const { toast } = useToast();

  // Auth check
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Role-based access check
  useEffect(() => {
    if (permissionsLoading) return;
    if (!permissions) return;
    const role = permissions.role;
    if (!['hrbp', 'manager', 'admin', 'hrbp_cl', 'manager_cl'].includes(role)) {
      navigate('/acceso-denegado');
    }
  }, [permissions, permissionsLoading, navigate]);

  const { data: empresasData } = useEmpresasQuery(!permissionsLoading && !!user);

  const filteredEmpresas = useMemo(() => {
    if (!empresasData || !permissions) return [];
    const unique = empresasData.reduce<typeof empresasData>((acc, cur) => {
      if (!acc.find((e) => e.nombre === cur.nombre)) acc.push(cur);
      return acc;
    }, []);
    return unique.filter((e) => hasAccess(e.nombre));
  }, [empresasData, permissions, hasAccess]);

  const { empleadosPorCuadrante, totalEmpleados, tablerosFuente, loading } =
    useConsolidatedNineBox(selectedEmpresaId || null);

  const countIn = (keys: string[]) =>
    keys.reduce((acc, k) => acc + (empleadosPorCuadrante[k]?.length || 0), 0);

  const empresaNombre = filteredEmpresas.find((e) => e.id === selectedEmpresaId)?.nombre || '';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Cargando datos...</div>
      </div>
    );
  }

  if (!permissions) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos asignados. Por favor contacta al administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const equiposCount = new Set(tablerosFuente.map((t) => t.equipo_nombre).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Nine Box Consolidado</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-2 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
                  {permissions.role.toUpperCase()}
                </span>
                <div className="flex gap-1">
                  {permissions.empresas_acceso.map((empresa) => (
                    <span
                      key={empresa}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground border border-border"
                    >
                      {empresa}
                    </span>
                  ))}
                </div>
              </div>
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
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Ninebox Talent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/curva-gauss')}>
                    Curva de Gauss
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/talent-management')}>
                    Gestión de Talento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/consolidated-ninebox')}>
                    Nine Box Consolidado
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="p-6">
          <div>
            <label className="text-sm font-medium mb-2 block">País</label>
            <Select value={selectedEmpresaId} onValueChange={setSelectedEmpresaId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    filteredEmpresas.length === 0 ? 'Sin países disponibles' : 'Seleccionar país'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredEmpresas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {selectedEmpresaId && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-blue-500/10 text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total personas</p>
                    <p className="text-2xl font-bold">{totalEmpleados}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-green-500/10 text-green-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Alto potencial</p>
                    <p className="text-2xl font-bold">{countIn(HIGH_KEYS)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-amber-500/10 text-amber-600">
                    <Minus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Medio</p>
                    <p className="text-2xl font-bold">{countIn(MID_KEYS)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-red-500/10 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">En riesgo</p>
                    <p className="text-2xl font-bold">{countIn(LOW_KEYS)}</p>
                  </div>
                </div>
              </Card>
            </div>

            <div id="ninebox-capture-area" className="bg-white space-y-6 p-4 rounded-lg">
              <div className="text-center pb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Nine Box Consolidado — {empresaNombre}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Consolidando todos los tableros de {empresaNombre}</p>
              </div>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Vista consolidada</h2>
                    <p className="text-sm text-muted-foreground">
                      Solo lectura — {totalEmpleados} persona{totalEmpleados !== 1 ? 's' : ''} de{' '}
                      {tablerosFuente.length} tablero{tablerosFuente.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2" data-no-capture>
                    <DownloadNineBoxImageButton
                      tableroNombre={empresaNombre}
                      empresaNombre={empresaNombre}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[720px]">
                    <div className="flex justify-center mb-2">
                      <div className="text-sm font-semibold text-foreground">
                        Desempeño (Performance) →
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center w-8">
                        <div className="transform -rotate-90 whitespace-nowrap text-sm font-semibold text-foreground">
                          Potencial (Potential) ↑
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="grid grid-cols-3 gap-3">
                          {QUADRANT_LAYOUT.map((q) => {
                            const list = empleadosPorCuadrante[q.id] || [];
                            const fgClass =
                              q.color === 'bg-high'
                                ? 'text-high-foreground'
                                : q.color === 'bg-medium'
                                ? 'text-medium-foreground'
                                : 'text-low-foreground';
                            return (
                              <Card
                                key={q.id}
                                className={`${q.color} p-4 min-h-[180px] border-2`}
                              >
                                <div className="flex flex-col h-full">
                                  <div className="mb-3">
                                    <h3 className={`font-bold text-sm mb-1 ${fgClass}`}>
                                      {q.title}
                                    </h3>
                                    <Badge variant="secondary" className="text-xs">
                                      {list.length} persona{list.length !== 1 ? 's' : ''}
                                    </Badge>
                                  </div>
                                  <div className="flex-1 flex flex-wrap gap-1 overflow-y-auto max-h-40">
                                    {list.map((emp) => (
                                      <TooltipProvider key={emp.id}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="text-xs px-2 py-0.5 rounded-md bg-white/80 border flex items-center gap-1 cursor-default">
                                              {emp.calibrado && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                              )}
                                              <span className="font-medium">
                                                {truncate(emp.nombre)}
                                              </span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div className="space-y-1">
                                              <p className="font-semibold">{emp.nombre}</p>
                                              <p className="text-xs">
                                                Desempeño: {emp.performanceScore.toFixed(2)}
                                              </p>
                                              <p className="text-xs">
                                                Potencial: {emp.potentialScore.toFixed(2)}
                                              </p>
                                              {emp.equipoNombre && (
                                                <p className="text-xs">Equipo: {emp.equipoNombre}</p>
                                              )}
                                              <p className="text-xs">Tablero: {emp.tableroNombre}</p>
                                              {emp.calibrado && (
                                                <p className="text-xs text-blue-600">
                                                  Calibración aplicada
                                                </p>
                                              )}
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ))}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 ml-10">
                      <div className="flex-1 text-center text-xs font-medium text-muted-foreground">
                        Bajo
                      </div>
                      <div className="flex-1 text-center text-xs font-medium text-muted-foreground">
                        Medio
                      </div>
                      <div className="flex-1 text-center text-xs font-medium text-muted-foreground">
                        Alto
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">
                    Consolidando {tablerosFuente.length} tablero
                    {tablerosFuente.length !== 1 ? 's' : ''} de {equiposCount} equipo
                    {equiposCount !== 1 ? 's' : ''}
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {tablerosFuente.map((t) => (
                      <li key={t.id}>
                        {t.nombre}
                        {t.equipo_nombre ? ` — ${t.equipo_nombre}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </div>
          </>
        )}

        {!selectedEmpresaId && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              Selecciona un país para ver la vista consolidada
            </p>
          </Card>
        )}

        {loading && selectedEmpresaId && (
          <p className="text-center text-sm text-muted-foreground">Cargando datos...</p>
        )}
      </div>
    </div>
  );
};

export default ConsolidatedNineBox;
