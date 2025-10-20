import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Plus } from 'lucide-react';
import { InteractiveNineBoxGrid } from '@/components/InteractiveNineBoxGrid';
import { StatisticsPanel } from '@/components/StatisticsPanel';
import { CreateBoardDialog } from '@/components/CreateBoardDialog';
import { FileUploader } from '@/components/FileUploader';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateEmpresaDialog } from '@/components/CreateEmpresaDialog';
import { CreateEquipoDialog } from '@/components/CreateEquipoDialog';
import { CalibrationExportButton } from '@/components/CalibrationExportButton';
import { Employee } from '@/types/employee';

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
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [tableros, setTableros] = useState<Tablero[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [selectedEquipo, setSelectedEquipo] = useState<string>('');
  const [selectedTablero, setSelectedTablero] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false);
  const [showCreateBoardDialog, setShowCreateBoardDialog] = useState(false);
  const [showCreateEmpresaDialog, setShowCreateEmpresaDialog] = useState(false);
  const [showCreateEquipoDialog, setShowCreateEquipoDialog] = useState(false);

  // Load empresas
  useEffect(() => {
    const loadEmpresas = async () => {
      const { data, error } = await supabase.from('empresas').select('*');
      if (error) {
        console.error('Error loading empresas:', error);
        toast({
          title: 'Error al cargar empresas',
          description: error.message.includes('policy') 
            ? 'No tienes permisos para ver las empresas. Contacta al administrador.'
            : `Error: ${error.message}. Si hay empresas duplicadas, limpia la tabla.`,
          variant: 'destructive',
        });
      } else {
        // Remove duplicates by nombre, keeping first occurrence
        const uniqueEmpresas = data?.reduce((acc: Empresa[], current) => {
          const exists = acc.find(item => item.nombre === current.nombre);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []) || [];
        setEmpresas(uniqueEmpresas);
      }
    };
    loadEmpresas();
  }, [toast]);

  // Load equipos when empresa changes
  useEffect(() => {
    if (!selectedEmpresa) {
      setEquipos([]);
      return;
    }

    const loadEquipos = async () => {
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .eq('empresa_id', selectedEmpresa);
      
      if (error) {
        console.error('Error loading equipos:', error);
        toast({
          title: 'Error al cargar equipos',
          description: error.message.includes('policy')
            ? 'No tienes permisos para ver los equipos.'
            : `Error: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        setEquipos(data || []);
      }
    };
    loadEquipos();
  }, [selectedEmpresa, toast]);

  // Load tableros when equipo changes
  useEffect(() => {
    if (!selectedEquipo) {
      setTableros([]);
      return;
    }

    const loadTableros = async () => {
      const { data, error } = await supabase
        .from('tableros')
        .select('*')
        .eq('equipo_id', selectedEquipo);
      
      if (error) {
        console.error('Error loading tableros:', error);
        toast({
          title: 'Error al cargar tableros',
          description: error.message.includes('policy')
            ? 'No tienes permisos para ver los tableros.'
            : `Error: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        setTableros(data || []);
        if (data && data.length > 0) {
          setSelectedTablero(data[0].id);
        }
      }
    };
    loadTableros();
  }, [selectedEquipo, toast]);

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

    // Subscribe to real-time changes
    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, [selectedTablero, toast]);

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

  const getPerformanceLevel = (score: number): 'Bajo' | 'Medio' | 'Alto' => {
    if (score >= 4) return 'Alto';
    if (score >= 3) return 'Medio';
    return 'Bajo';
  };

  const getPotentialLevel = (score: number): 'Bajo' | 'Medio' | 'Alto' => {
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

  const handleGoToAuth = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Nine Box Grid - Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-2 px-2 py-1 bg-primary/10 text-primary rounded-md">
                  🎯 Modo Demo Activo - Sin Autenticación
                </span>
              </p>
            </div>
            <Button variant="outline" onClick={handleGoToAuth}>
              <LogIn className="mr-2 h-4 w-4" />
              Ver Login
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Empresa</label>
                {empresas.length === 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCreateEmpresaDialog(true)}
                    className="h-6 text-xs"
                  >
                    + Crear
                  </Button>
                )}
              </div>
              <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                <SelectTrigger>
                  <SelectValue placeholder={empresas.length === 0 ? "Sin empresas" : "Seleccionar empresa"} />
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Equipo</label>
                {selectedEmpresa && equipos.length === 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCreateEquipoDialog(true)}
                    className="h-6 text-xs"
                  >
                    + Crear
                  </Button>
                )}
              </div>
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
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tablero</label>
              <div className="flex gap-2">
                <Select value={selectedTablero} onValueChange={setSelectedTablero} disabled={!selectedEquipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tablero" />
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
                disabled={!selectedEquipo}
                className="flex-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Tablero
              </Button>
              <Button
                onClick={() => setShowFileUploadDialog(true)}
                disabled={!selectedTablero}
                variant="secondary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Evaluación
              </Button>
              <CalibrationExportButton tableroId={selectedTablero} />
            </div>
          </div>
        </Card>

        {selectedTablero && (
          <>
            <StatisticsPanel employees={employees} />
            <InteractiveNineBoxGrid employees={employees} tableroId={selectedTablero} />
          </>
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
        onCreated={async (tableroId) => {
          // Reload tableros
          const { data } = await supabase
            .from('tableros')
            .select('*')
            .eq('equipo_id', selectedEquipo);
          setTableros(data || []);
          setSelectedTablero(tableroId);
          setShowCreateBoardDialog(false);
        }}
      />

      <CreateEmpresaDialog
        open={showCreateEmpresaDialog}
        onOpenChange={setShowCreateEmpresaDialog}
        onCreated={async () => {
          // Reload empresas
          const { data } = await supabase.from('empresas').select('*');
          if (data) {
            const uniqueEmpresas = data.reduce((acc: Empresa[], current) => {
              const exists = acc.find(item => item.nombre === current.nombre);
              if (!exists) {
                acc.push(current);
              }
              return acc;
            }, []);
            setEmpresas(uniqueEmpresas);
          }
          setShowCreateEmpresaDialog(false);
        }}
      />

      <CreateEquipoDialog
        open={showCreateEquipoDialog}
        onOpenChange={setShowCreateEquipoDialog}
        empresaId={selectedEmpresa}
        onCreated={async () => {
          // Reload equipos
          const { data } = await supabase
            .from('equipos')
            .select('*')
            .eq('empresa_id', selectedEmpresa);
          setEquipos(data || []);
          setShowCreateEquipoDialog(false);
        }}
      />
    </div>
  );
};

export default Dashboard;
