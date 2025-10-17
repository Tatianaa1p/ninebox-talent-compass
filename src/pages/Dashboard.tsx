import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus } from 'lucide-react';
import { InteractiveNineBoxGrid } from '@/components/InteractiveNineBoxGrid';
import { StatisticsPanel } from '@/components/StatisticsPanel';
import { EvaluationDialog } from '@/components/EvaluationDialog';
import { CreateBoardDialog } from '@/components/CreateBoardDialog';
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

interface Evaluacion {
  id: string;
  persona_nombre: string;
  potencial_score: number;
  desempeño_score: number;
  equipo_id: string;
  tablero_id: string;
}

const Dashboard = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [tableros, setTableros] = useState<Tablero[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [selectedEquipo, setSelectedEquipo] = useState<string>('');
  const [selectedTablero, setSelectedTablero] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [showCreateBoardDialog, setShowCreateBoardDialog] = useState(false);

  // Load empresas
  useEffect(() => {
    const loadEmpresas = async () => {
      const { data, error } = await supabase.from('empresas').select('*');
      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las empresas',
          variant: 'destructive',
        });
      } else {
        setEmpresas(data || []);
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
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los equipos',
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
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los tableros',
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

  // Load evaluaciones and subscribe to changes
  useEffect(() => {
    if (!selectedTablero) {
      setEvaluaciones([]);
      setEmployees([]);
      return;
    }

    const loadEvaluaciones = async () => {
      const { data, error } = await supabase
        .from('evaluaciones')
        .select('*')
        .eq('tablero_id', selectedTablero);
      
      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las evaluaciones',
          variant: 'destructive',
        });
      } else {
        setEvaluaciones(data || []);
        convertToEmployees(data || []);
      }
    };

    loadEvaluaciones();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('evaluaciones-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evaluaciones',
          filter: `tablero_id=eq.${selectedTablero}`,
        },
        () => {
          loadEvaluaciones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTablero, toast]);

  const convertToEmployees = (evals: Evaluacion[]) => {
    const emps: Employee[] = evals.map((e) => ({
      id: e.id,
      name: e.persona_nombre,
      manager: '',
      performance: getPerformanceLevel(e.desempeño_score),
      potential: getPotentialLevel(e.potencial_score),
      performanceScore: e.desempeño_score,
      potentialScore: e.potencial_score,
    }));
    setEmployees(emps);
  };

  const getPerformanceLevel = (score: number): 'Bajo' | 'Medio' | 'Alto' => {
    if (score <= 1.5) return 'Bajo';
    if (score <= 3.9) return 'Medio';
    return 'Alto';
  };

  const getPotentialLevel = (score: number): 'Bajo' | 'Medio' | 'Alto' => {
    if (score <= 1.5) return 'Bajo';
    if (score <= 3.9) return 'Medio';
    return 'Alto';
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión exitosamente',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nine Box Grid - Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Empresa</label>
              <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
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
              <label className="text-sm font-medium mb-2 block">Equipo</label>
              <Select value={selectedEquipo} onValueChange={setSelectedEquipo} disabled={!selectedEmpresa}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo" />
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
                onClick={() => setShowEvaluationDialog(true)}
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
            <InteractiveNineBoxGrid employees={employees} />
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

      <EvaluationDialog
        open={showEvaluationDialog}
        onOpenChange={setShowEvaluationDialog}
        equipoId={selectedEquipo}
        tableroId={selectedTablero}
      />

      <CreateBoardDialog
        open={showCreateBoardDialog}
        onOpenChange={setShowCreateBoardDialog}
        equipoId={selectedEquipo}
        empresaId={selectedEmpresa}
        onCreated={(tableroId) => {
          setSelectedTablero(tableroId);
          setShowCreateBoardDialog(false);
        }}
      />
    </div>
  );
};

export default Dashboard;
