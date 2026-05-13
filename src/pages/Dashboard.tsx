import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, AlertCircle, Grid3x3, Sparkles, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InteractiveNineBoxGrid } from '@/components/InteractiveNineBoxGrid';
import { StatisticsPanel } from '@/components/StatisticsPanel';
import { CreateBoardDialog } from '@/components/CreateBoardDialog';
import { FileUploader } from '@/components/FileUploader';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CreateEmpresaDialog } from '@/components/CreateEmpresaDialog';
import { CreateEquipoDialog } from '@/components/CreateEquipoDialog';
import { CalibrationExportButton } from '@/components/CalibrationExportButton';
import { DownloadReportButton } from '@/components/DownloadReportButton';
import { DownloadNineBoxImageButton } from '@/components/DownloadNineBoxImageButton';
import { Employee } from '@/types/employee';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEmpresasQuery } from '@/hooks/queries/useEmpresasQuery';
import { useEquiposQuery } from '@/hooks/queries/useEquiposQuery';
import { useTablerosQuery } from '@/hooks/queries/useTablerosQuery';
import { usePeriodosQuery } from '@/hooks/queries/usePeriodosQuery';
import { PeriodoSelector } from '@/components/PeriodoSelector';
import { useQueryClient } from '@tanstack/react-query';
import { TalentAnalysisResult, type AnalisisData } from '@/components/TalentAnalysisResult';

interface Empresa {
  id: string;
  nombre: string;
}

interface Equipo {
  id: string;
  nombre: string;
  empresa_id: string;
}

interface Tablero {
  id: string;
  nombre: string;
  equipo_id: string;
}

interface Empleado {
  id: string;
  nombre: string;
  performance: number;
  potencial: number;
  tablero_id: string;
}

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { permissions, loading: permissionsLoading, hasAccess, canCreateTableros, canCalibrateTableros } = useUserPermissions();
  
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  // Memoize filtered empresas by permissions
  const filteredEmpresas = useMemo(() => {
    if (!permissions) return [];
    const uniqueEmpresas = empresas.reduce((acc: Empresa[], current) => {
      const exists = acc.find(item => item.nombre === current.nombre);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
    return uniqueEmpresas.filter(empresa => hasAccess(empresa.nombre));
  }, [empresas, permissions, hasAccess]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [tableros, setTableros] = useState<Tablero[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [selectedPeriodo, setSelectedPeriodo] = useState<number>(new Date().getFullYear());
  const [selectedEquipo, setSelectedEquipo] = useState<string>('');
  const [selectedTablero, setSelectedTablero] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false);
  const [showCreateBoardDialog, setShowCreateBoardDialog] = useState(false);
  const [showCreateEmpresaDialog, setShowCreateEmpresaDialog] = useState(false);
  const [showCreateEquipoDialog, setShowCreateEquipoDialog] = useState(false);
  const [showCrearEquipoDialog, setShowCrearEquipoDialog] = useState(false);
  const [nuevoEquipoNombre, setNuevoEquipoNombre] = useState('');
  const [creandoEquipo, setCreandoEquipo] = useState(false);
  const [showDeleteEquipoDialog, setShowDeleteEquipoDialog] = useState(false);
  const [deletingEquipo, setDeletingEquipo] = useState(false);
  const [analisisTalento, setAnalisisTalento] = useState<AnalisisData | null>(null);
  const [analizando, setAnalizando] = useState(false);

  // Use cached queries
  const { data: empresasFromQuery, isLoading: isLoadingEmpresas } = useEmpresasQuery(!permissionsLoading && !!user);
  const { data: equiposFromQuery } = useEquiposQuery(selectedEmpresa);
  const { data: periodosDisponibles = [] } = usePeriodosQuery(selectedEmpresa);
  const { data: tablerosFromQuery } = useTablerosQuery(selectedEquipo, selectedPeriodo);

  // Auto-ajustar al período más reciente disponible cuando cambia la empresa
  useEffect(() => {
    if (periodosDisponibles.length > 0 && !periodosDisponibles.includes(selectedPeriodo)) {
      setSelectedPeriodo(periodosDisponibles[0]);
    }
  }, [periodosDisponibles, selectedPeriodo]);

  // Load empresas from cache
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (permissionsLoading) return;

    if (empresasFromQuery) {
      console.log('✅ Empresas loaded from cache:', empresasFromQuery);
      setEmpresas(empresasFromQuery);
    }
  }, [user?.id, permissionsLoading, empresasFromQuery, navigate]);

  // Load equipos from cache
  useEffect(() => {
    if (!selectedEmpresa) {
      setEquipos([]);
      setSelectedEquipo('');
      return;
    }

    if (equiposFromQuery) {
      setEquipos(equiposFromQuery);
      // Auto-select first equipo if available
      if (equiposFromQuery.length > 0) {
        setSelectedEquipo(equiposFromQuery[0].id);
      } else {
        setSelectedEquipo('');
      }
    }
  }, [selectedEmpresa, equiposFromQuery]);

  // Load tableros from cache
  useEffect(() => {
    if (!selectedEquipo) {
      setTableros([]);
      setSelectedTablero('');
      return;
    }

    if (tablerosFromQuery) {
      setTableros(tablerosFromQuery);
      if (tablerosFromQuery.length > 0) {
        setSelectedTablero(tablerosFromQuery[0].id);
      } else {
        setSelectedTablero('');
      }
    }
  }, [selectedEquipo, tablerosFromQuery]);

  // Load empleados and subscribe to changes
  useEffect(() => {
    if (!selectedTablero) {
      setEmpleados([]);
      setEmployees([]);
      return;
    }

    const loadEmpleados = async () => {
      const { data, error } = await supabase
        .from('empleados' as any)
        .select('*')
        .eq('tablero_id', selectedTablero);
      
      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los empleados',
          variant: 'destructive',
        });
      } else {
        setEmpleados((data as any) || []);
        convertToEmployees((data as any) || []);
      }
    };

    loadEmpleados();

    // Subscribe to real-time changes on empleados table
    const empleadosChannel = supabase
      .channel('empleados-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'empleados',
          filter: `tablero_id=eq.${selectedTablero}`,
        },
        () => {
          loadEmpleados();
        }
      )
      .subscribe();

    return () => {
      try {
        empleadosChannel.unsubscribe();
      } catch (_) {
        // Ignore cleanup errors
      }
    };
  }, [selectedTablero, toast]);

  // Function to reload empleados (used after calibration)
  const reloadEmpleados = async () => {
    if (!selectedTablero) return;
    
    console.log('🔄 Reloading empleados after calibration...');
    
    const { data, error } = await supabase
      .from('empleados' as any)
      .select('*')
      .eq('tablero_id', selectedTablero);
    
    if (error) {
      console.error('❌ Error reloading empleados:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los empleados',
        variant: 'destructive',
      });
    } else {
      console.log('✅ Empleados reloaded:', data);
      setEmpleados((data as any) || []);
      convertToEmployees((data as any) || []);
    }
  };

  const convertToEmployees = (emps: Empleado[]) => {
    const employees: Employee[] = emps.map((e) => ({
      id: e.id,
      name: e.nombre,
      manager: '',
      performance: getPerformanceLevel(e.performance),
      potential: getPotentialLevel(e.potencial),
      performanceScore: e.performance,
      potentialScore: e.potencial,
    }));
    setEmployees(employees);
  };

  // Reset analysis when changing tablero
  useEffect(() => {
    setAnalisisTalento(null);
  }, [selectedTablero]);

  const handleAnalizarTalento = async () => {
    setAnalizando(true);
    setAnalisisTalento(null);

    const nombresCuadrante: Record<string, string> = {
      'Alto-Alto': 'Talento Estratégico',
      'Alto-Medio': 'Desarrollar',
      'Alto-Bajo': 'Enigma',
      'Medio-Alto': 'Consistente',
      'Medio-Medio': 'Clave',
      'Medio-Bajo': 'Dilema',
      'Bajo-Alto': 'Confiable',
      'Bajo-Medio': 'Estancamiento',
      'Bajo-Bajo': 'Riesgo',
    };

    const porCuadrante = employees.reduce((acc, emp) => {
      const key = `${emp.potential}-${emp.performance}`;
      const cuadrante = nombresCuadrante[key] || key;
      if (!acc[cuadrante]) acc[cuadrante] = [];
      acc[cuadrante].push(emp.name);
      return acc;
    }, {} as Record<string, string[]>);

    const equipoNombre = equipos.find((e) => e.id === selectedEquipo)?.nombre || 'Equipo';
    const tableroNombre = tableros.find((t) => t.id === selectedTablero)?.nombre || 'Tablero';
    const empresaNombre = empresas.find((e) => e.id === selectedEmpresa)?.nombre || 'Empresa';

    // Traer planes de talento del tablero actual (solo lectura, opcional)
    let planesResumen: {
      totalConPlanDesarrollo: number;
      totalConPip: number;
      pipPendiente: number;
      pipEnCurso: number;
      pipCompletado: number;
    } | null = null;
    try {
      const { data: planes } = await supabase
        .from('talent_plans' as any)
        .select('tipo, pip_estado, empleado_id')
        .eq('tablero_id', selectedTablero);

      const lista = ((planes || []) as unknown) as Array<{ tipo: string; pip_estado: string | null }>;
      planesResumen = {
        totalConPlanDesarrollo: lista.filter((p) => p.tipo === 'desarrollo').length,
        totalConPip: lista.filter((p) => p.tipo === 'riesgo').length,
        pipPendiente: lista.filter((p) => p.tipo === 'riesgo' && p.pip_estado === 'pendiente').length,
        pipEnCurso: lista.filter((p) => p.tipo === 'riesgo' && p.pip_estado === 'en_curso').length,
        pipCompletado: lista.filter((p) => p.tipo === 'riesgo' && p.pip_estado === 'completado').length,
      };
    } catch (e) {
      console.warn('No se pudieron traer los planes de talento:', e);
    }

    try {
      const { data, error } = await supabase.functions.invoke('analizar-tendencias-ninebox', {
        body: {
          modo: 'tablero',
          empresa: empresaNombre,
          equipo: equipoNombre,
          tablero: tableroNombre,
          totalEmpleados: employees.length,
          distribucion: porCuadrante,
          planes: planesResumen,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const texto: string = (data?.analisis ?? '').trim().replace(/^```json\s*|^```\s*|```$/g, '').trim();
      const parsed = JSON.parse(texto) as AnalisisData;
      setAnalisisTalento(parsed);
    } catch (err: unknown) {
      console.error('Error al analizar:', err);
      const msg = err instanceof Error && !(err instanceof SyntaxError)
        ? err.message
        : 'No se pudo generar el análisis. Intentá nuevamente.';
      toast({
        title: 'Error al generar análisis',
        description: msg,
        variant: 'destructive',
      });
      setAnalisisTalento(null);
    } finally {
      setAnalizando(false);
    }
  };

  const getPerformanceLevel = (score: number): 'Bajo' | 'Medio' | 'Alto' => {
    console.log(`🔵 Dashboard getPerformanceLevel: score=${score}`);
    if (score >= 4) return 'Alto';
    if (score >= 3) return 'Medio';
    return 'Bajo';
  };

  const getPotentialLevel = (score: number): 'Bajo' | 'Medio' | 'Alto' => {
    console.log(`🔵 Dashboard getPotentialLevel: score=${score}`);
    if (score > 2.5) return 'Alto';
    if (score > 1.5) return 'Medio';
    return 'Bajo';
  };

  const handleFilesUploaded = async (
    performanceData: Array<{nombre: string, performance: number}>,
    potentialData: Array<{nombre: string, potencial: number}>
  ) => {
    // Combine data by nombre
    const combined = new Map<string, {performance?: number, potencial?: number}>();
    
    performanceData.forEach(p => {
      combined.set(p.nombre, { ...combined.get(p.nombre), performance: p.performance });
    });
    
    potentialData.forEach(p => {
      const existing = combined.get(p.nombre) || {};
      combined.set(p.nombre, { ...existing, potencial: p.potencial });
    });

    // Prepare records for insertion (preserve exact decimal values)
    const records = Array.from(combined.entries())
      .filter(([_, data]) => data.performance !== undefined && data.potencial !== undefined)
      .map(([nombre, data]) => ({
        nombre,
        performance: data.performance!,
        potencial: data.potencial!,
        tablero_id: selectedTablero
      }));

    if (records.length === 0) {
      toast({
        title: 'Error',
        description: 'No se encontraron empleados con ambos valores (performance y potencial)',
        variant: 'destructive',
      });
      return;
    }

    // Insert/update in Supabase
    const { error } = await supabase
      .from('empleados' as any)
      .upsert(records, { 
        onConflict: 'nombre,tablero_id',
        ignoreDuplicates: false 
      });

    if (error) {
      toast({
        title: 'Error al guardar',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    // Reload data
    const { data: updatedData } = await supabase
      .from('empleados' as any)
      .select('*')
      .eq('tablero_id', selectedTablero);
    
    if (updatedData) {
      setEmpleados(updatedData as any);
      convertToEmployees(updatedData as any);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleCrearEquipo = async () => {
    if (!nuevoEquipoNombre.trim() || !selectedEmpresa) return;
    setCreandoEquipo(true);
    try {
      const { data, error } = await supabase
        .from('equipos')
        .insert({
          nombre: nuevoEquipoNombre.trim(),
          empresa_id: selectedEmpresa,
        })
        .select()
        .single();
      if (error) throw error;
      setShowCrearEquipoDialog(false);
      setNuevoEquipoNombre('');
      await queryClient.invalidateQueries({ queryKey: ['equipos', selectedEmpresa] });
      setSelectedEquipo(data.id);
      toast({ title: `Equipo "${data.nombre}" creado correctamente` });
    } catch (error) {
      console.error('Error al crear equipo:', error);
      toast({ title: 'Error al crear el equipo', variant: 'destructive' });
    } finally {
      setCreandoEquipo(false);
    }
  };

  const handleDeleteEquipo = async () => {
    if (!selectedEquipo) return;
    setDeletingEquipo(true);
    try {
      const { error } = await supabase
        .from('equipos')
        .delete()
        .eq('id', selectedEquipo);
      if (error) throw error;
      setShowDeleteEquipoDialog(false);
      setSelectedEquipo('');
      setSelectedTablero('');
      await queryClient.invalidateQueries({ queryKey: ['equipos', selectedEmpresa] });
      toast({ title: 'Equipo eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      toast({ title: 'Error al eliminar el equipo', variant: 'destructive' });
    } finally {
      setDeletingEquipo(false);
    }
  };

  const getUserDisplayName = () => {
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name.split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    }
    return 'Usuario';
  };

  if (permissionsLoading || isLoadingEmpresas) {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/seidor-logo.png" alt="Seidor" className="h-6 md:h-8 w-auto object-contain" />
              <div className="w-px h-8 bg-border" />
              <div>
                <h1 className="text-2xl font-bold">Nine Box Grid - Gestión Talento Seidor</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-2 px-2 py-1 bg-green-500/10 text-green-600 rounded-md text-sm">
                  ✓ {getUserDisplayName()}
                </span>
                <span className="inline-flex items-center gap-2 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
                  {permissions.role.toUpperCase()}
                </span>
                <div className="flex gap-1">
                  {permissions.empresas_acceso.map((empresa) => (
                    <span key={empresa} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground border border-border">
                      {empresa}
                    </span>
                  ))}
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <PeriodoSelector
              value={selectedPeriodo}
              onChange={(p) => {
                setSelectedPeriodo(p);
                setSelectedTablero('');
              }}
              periodos={periodosDisponibles.length > 0 ? periodosDisponibles : [selectedPeriodo]}
            />
            <div>
              <label className="text-sm font-medium mb-2 block">Empresa</label>
              <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                <SelectTrigger>
                  <SelectValue placeholder={filteredEmpresas.length === 0 ? "Sin empresas" : "Seleccionar empresa"} />
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

            <div>
              <label className="text-sm font-medium mb-2 block">Equipo</label>
              <div className="flex items-center gap-1">
                <Select value={selectedEquipo} onValueChange={setSelectedEquipo} disabled={!selectedEmpresa}>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedEmpresa ? "Selecciona empresa primero" : equipos.length === 0 ? "Sin equipos" : "Seleccionar equipo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {equipos.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEmpresa && (permissions?.role === 'manager' || permissions?.role === 'hrbp' || permissions?.role === 'admin') && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setShowCrearEquipoDialog(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                {selectedEquipo && (permissions?.role === 'manager' || permissions?.role === 'hrbp' || permissions?.role === 'admin') && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteEquipoDialog(true)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tablero</label>
              <div className="flex gap-2">
                <Select value={selectedTablero} onValueChange={setSelectedTablero} disabled={!selectedEquipo}>
                  <SelectTrigger>
                    <SelectValue placeholder={tableros.length === 0 ? "No hay tableros creados" : "Seleccionar tablero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tableros.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTablero && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={async () => {
                      if (confirm('¿Estás seguro de que deseas eliminar este tablero y todos sus empleados?')) {
                        const { error: empleadosError } = await supabase
                          .from('empleados' as any)
                          .delete()
                          .eq('tablero_id', selectedTablero);

                        if (empleadosError) {
                          toast({
                            title: 'Error',
                            description: 'No se pudieron eliminar los empleados',
                            variant: 'destructive',
                          });
                          return;
                        }

                        const { error: tableroError } = await supabase
                          .from('tableros')
                          .delete()
                          .eq('id', selectedTablero);

                        if (tableroError) {
                          toast({
                            title: 'Error',
                            description: 'No se pudo eliminar el tablero',
                            variant: 'destructive',
                          });
                          return;
                        }

                        const { data } = await supabase
                          .from('tableros')
                          .select('*')
                          .eq('equipo_id', selectedEquipo);
                        
                        setTableros(data || []);
                        setSelectedTablero('');
                        setEmpleados([]);
                        setEmployees([]);

                        toast({
                          title: 'Tablero eliminado',
                          description: 'El tablero y sus empleados han sido eliminados',
                        });
                      }
                    }}
                  >
                    🗑️
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={() => setShowCreateBoardDialog(true)}
                disabled={!selectedEquipo || !canCreateTableros()}
                className={canCreateTableros() ? "border-2 border-green-500/50" : ""}
                title={!canCreateTableros() ? "No tienes permisos para crear tableros" : ""}
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Tablero
              </Button>
              {selectedEmpresa && (permissions?.role === 'manager' || permissions?.role === 'hrbp' || permissions?.role === 'admin') && (
                <Button variant="outline" onClick={() => setShowCrearEquipoDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Equipo
                </Button>
              )}
              {selectedEquipo && (permissions?.role === 'manager' || permissions?.role === 'hrbp' || permissions?.role === 'admin') && (
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                  onClick={() => setShowDeleteEquipoDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Equipo
                </Button>
              )}
              <Button
                onClick={() => setShowFileUploadDialog(true)}
                disabled={!selectedTablero || !canCalibrateTableros()}
                variant="secondary"
                className={canCalibrateTableros() ? "border-2 border-blue-500/50" : ""}
                title={!canCalibrateTableros() ? "No tienes permisos para calibrar tableros" : ""}
              >
                <Plus className="mr-2 h-4 w-4" />
                Evaluación
              </Button>
            </div>
          </div>
        </Card>

        {selectedTablero && (
          <div id="ninebox-capture-area" className="bg-white space-y-6 p-4 rounded-lg">
            <div className="text-center pb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Nine Box Grid — {empresas.find(e => e.id === selectedEmpresa)?.nombre || ''}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Tablero: {tableros.find(t => t.id === selectedTablero)?.nombre || ''}
              </p>
            </div>
            <StatisticsPanel employees={employees} />
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Nine Box Grid</h2>
                  <p className="text-sm text-muted-foreground">
                    Calibra y visualiza el talento de tu equipo
                  </p>
                </div>
                <div className="flex gap-2" data-no-capture>
                  <CalibrationExportButton tableroId={selectedTablero} />
                  <DownloadReportButton
                    tableroId={selectedTablero}
                    empresaId={selectedEmpresa}
                    empresaNombre={empresas.find(e => e.id === selectedEmpresa)?.nombre || ''}
                  />
                  <DownloadNineBoxImageButton
                    tableroNombre={tableros.find(t => t.id === selectedTablero)?.nombre || ''}
                    empresaNombre={empresas.find(e => e.id === selectedEmpresa)?.nombre || ''}
                  />
                </div>
              </div>
              <InteractiveNineBoxGrid 
                employees={employees} 
                tableroId={selectedTablero} 
                onDataReload={reloadEmpleados}
              />
            </Card>
          </div>
        )}

        {selectedTablero && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold">Análisis de talento con IA</h3>
                <p className="text-sm text-muted-foreground">
                  Análisis de la distribución del equipo en este tablero
                </p>
              </div>
              <Button
                onClick={handleAnalizarTalento}
                disabled={analizando || employees.length === 0}
                variant="outline"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {analizando
                  ? 'Analizando...'
                  : analisisTalento
                  ? 'Regenerar análisis'
                  : 'Analizar con IA'}
              </Button>
            </div>

            {analizando && (
              <div className="text-sm text-muted-foreground animate-pulse">
                Analizando la distribución del talento del equipo...
              </div>
            )}

            {analisisTalento && !analizando && (
              <TalentAnalysisResult data={analisisTalento} />
            )}

            {employees.length === 0 && !analizando && (
              <p className="text-sm text-muted-foreground italic">
                Cargá empleados en el tablero para habilitar el análisis.
              </p>
            )}
          </Card>
        )}

        {!selectedTablero && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              Selecciona una empresa, equipo y tablero para ver las evaluaciones
            </p>
          </Card>
        )}
      </div>

      <Dialog open={showFileUploadDialog} onOpenChange={setShowFileUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cargar Evaluaciones Masivas</DialogTitle>
            <DialogDescription>
              Sube archivos CSV o Excel con las evaluaciones de performance y potencial (valores 1-5)
            </DialogDescription>
          </DialogHeader>
          <FileUploader 
            onFilesUploaded={handleFilesUploaded}
            onClose={() => setShowFileUploadDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <CreateBoardDialog
        open={showCreateBoardDialog}
        onOpenChange={setShowCreateBoardDialog}
        equipoId={selectedEquipo}
        empresaId={selectedEmpresa}
        defaultPeriodo={selectedPeriodo}
        onCreated={async (tableroId) => {
          // Invalidate and refetch tableros + periodos
          await queryClient.invalidateQueries({ queryKey: ['tableros', selectedEquipo] });
          await queryClient.invalidateQueries({ queryKey: ['periodos'] });
          setSelectedTablero(tableroId);
          setShowCreateBoardDialog(false);
        }}
      />

      <CreateEmpresaDialog
        open={showCreateEmpresaDialog}
        onOpenChange={setShowCreateEmpresaDialog}
        onCreated={async () => {
          // Invalidate and refetch empresas
          await queryClient.invalidateQueries({ queryKey: ['empresas'] });
          setShowCreateEmpresaDialog(false);
        }}
      />

      <CreateEquipoDialog
        open={showCreateEquipoDialog}
        onOpenChange={setShowCreateEquipoDialog}
        empresaId={selectedEmpresa}
        onCreated={async () => {
          // Invalidate and refetch equipos
          await queryClient.invalidateQueries({ queryKey: ['equipos', selectedEmpresa] });
          setShowCreateEquipoDialog(false);
        }}
      />

      <Dialog open={showCrearEquipoDialog} onOpenChange={setShowCrearEquipoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo equipo</DialogTitle>
            <DialogDescription>
              El equipo se creará dentro de{' '}
              <strong>{empresas.find(e => e.id === selectedEmpresa)?.nombre}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Nombre del equipo</label>
              <Input
                value={nuevoEquipoNombre}
                onChange={(e) => setNuevoEquipoNombre(e.target.value)}
                placeholder="Ej: Capital Humano, IT, Finanzas..."
                onKeyDown={(e) => e.key === 'Enter' && handleCrearEquipo()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCrearEquipoDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCrearEquipo}
              disabled={!nuevoEquipoNombre.trim() || creandoEquipo}
            >
              {creandoEquipo ? 'Creando...' : 'Crear equipo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteEquipoDialog} onOpenChange={setShowDeleteEquipoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el equipo
              <strong> "{equipos.find(e => e.id === selectedEquipo)?.nombre}"</strong>
              {' '}y <strong>todos sus tableros, empleados y calibraciones</strong>.
              No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteEquipo}
              disabled={deletingEquipo}
            >
              {deletingEquipo ? 'Eliminando...' : 'Sí, eliminar todo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
