import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus } from 'lucide-react';
import { InteractiveNineBoxGrid } from '@/components/InteractiveNineBoxGrid';
import { StatisticsPanel } from '@/components/StatisticsPanel';
import { CreateBoardDialog } from '@/components/CreateBoardDialog';
import { FileUploader } from '@/components/FileUploader';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateEmpresaDialog } from '@/components/CreateEmpresaDialog';
import { CreateEquipoDialog } from '@/components/CreateEquipoDialog';
import { CalibrationExportButton } from '@/components/CalibrationExportButton';
import { Employee } from '@/types/employee';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, signOut } = useAuth();
  
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

  // Load empresas from Supabase
  useEffect(() => {
    const loadEmpresas = async () => {
      console.log('🔍 Cargando empresas...');
      console.log('👤 Usuario autenticado:', user?.email);
      
      const { data, error } = await supabase.from('empresas').select('*');
      
      console.log('📊 Resultado empresas - Data:', data);
      console.log('❌ Resultado empresas - Error:', error);
      
      if (error) {
        console.error('Error loading empresas:', error);
        toast({
          title: 'Error al cargar empresas',
          description: error.message.includes('policy') 
            ? 'No tienes permisos para ver las empresas. Contacta al administrador.'
            : `Error: ${error.message}`,
          variant: 'destructive',
        });
        setEmpresas([]);
      } else {
        // Remove duplicates by nombre, keeping first occurrence
        const uniqueEmpresas = data?.reduce((acc: Empresa[], current) => {
          const exists = acc.find(item => item.nombre === current.nombre);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []) || [];
        console.log('✅ Empresas únicas cargadas:', uniqueEmpresas);
        setEmpresas(uniqueEmpresas);
      }
    };
    
    if (user) {
      loadEmpresas();
    }
  }, [user, toast]);

  // Load equipos when empresa changes - FROM SUPABASE
  useEffect(() => {
    if (!selectedEmpresa) {
      setEquipos([]);
      setSelectedEquipo('');
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
        setEquipos([]);
      } else {
        setEquipos(data || []);
        // Auto-select first equipo if available
        if (data && data.length > 0) {
          setSelectedEquipo(data[0].id);
        } else {
          setSelectedEquipo('');
        }
      }
    };
    loadEquipos();
  }, [selectedEmpresa, toast]);

  // Load tableros when equipo changes
  useEffect(() => {
    if (!selectedEquipo) {
      setTableros([]);
      setSelectedTablero('');
      return;
    }

    const loadTableros = async () => {
      const { data, error } = await supabase
        .from('tableros')
        .select('*')
        .eq('equipo_id', selectedEquipo);
      
      if (error) {
        console.error('Error loading tableros:', error);
        // Only show error if it's not a "no rows" situation
        if (!error.message.includes('0 rows')) {
          toast({
            title: 'Error al cargar tableros',
            description: error.message.includes('policy')
              ? 'No tienes permisos para ver los tableros.'
              : `Error: ${error.message}`,
            variant: 'destructive',
          });
        }
        setTableros([]);
        setSelectedTablero('');
      } else {
        setTableros(data || []);
        if (data && data.length > 0) {
          setSelectedTablero(data[0].id);
        } else {
          setSelectedTablero('');
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
      supabase.removeChannel(empleadosChannel);
    };
  }, [selectedTablero, toast]);

  // Function to reload empleados (used after calibration)
  const reloadEmpleados = async () => {
    if (!selectedTablero) return;
    
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Nine Box Grid - Gestión Talento Seidor</h1>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-2 px-2 py-1 bg-green-500/10 text-green-600 rounded-md">
                  ✓ Sesión Activa - {getUserDisplayName()}
                </span>
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Empresa</label>
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
              <label className="text-sm font-medium mb-2 block">Equipo</label>
              <div className="flex gap-2">
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
                <Button
                  size="icon"
                  onClick={() => setShowCreateEquipoDialog(true)}
                  disabled={!selectedEmpresa}
                >
                  <Plus className="h-4 w-4" />
                </Button>
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
            </div>
          </div>
        </Card>

        {selectedTablero && (
          <>
            <StatisticsPanel employees={employees} />
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Nine Box Grid</h2>
                  <p className="text-sm text-muted-foreground">
                    Calibra y visualiza el talento de tu equipo
                  </p>
                </div>
                <CalibrationExportButton tableroId={selectedTablero} />
              </div>
              <InteractiveNineBoxGrid 
                employees={employees} 
                tableroId={selectedTablero} 
                onDataReload={reloadEmpleados}
              />
            </Card>
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
          // Reload empresas from Supabase
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
          // Reload equipos from Supabase
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
