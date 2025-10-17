import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Plus, Building2, Users } from "lucide-react";
import { InteractiveNineBoxGrid } from "@/components/InteractiveNineBoxGrid";
import { EvaluationDialog } from "@/components/EvaluationDialog";
import { CreateEmpresaDialog } from "@/components/CreateEmpresaDialog";
import { CreateEquipoDialog } from "@/components/CreateEquipoDialog";
import { Employee } from "@/types/employee";
import { OverrideProvider } from "@/contexts/OverrideContext";

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
  empresa_id: string;
}

interface Evaluacion {
  id: string;
  persona_nombre: string;
  potencial_score: number;
  desempeno_score: number;
  equipo_id: string;
  tablero_id: string;
}

const HRBPDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("");
  const [selectedEquipo, setSelectedEquipo] = useState<string>("");
  const [tablero, setTablero] = useState<Tablero | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [isCreateEmpresaDialogOpen, setIsCreateEmpresaDialogOpen] = useState(false);
  const [isCreateEquipoDialogOpen, setIsCreateEquipoDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar rol HRBP
  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "hrbp")
        .maybeSingle();

      if (error || !data) {
        toast.error("No tienes permisos de HRBP");
        navigate("/");
      }
    };

    checkRole();
  }, [user, navigate]);

  // Cargar empresas
  useEffect(() => {
    const fetchEmpresas = async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("nombre");

      if (error) {
        toast.error("Error al cargar empresas");
        return;
      }

      setEmpresas(data || []);
      setLoading(false);
    };

    fetchEmpresas();
  }, []);

  // Cargar equipos cuando cambia la empresa
  useEffect(() => {
    if (!selectedEmpresa) {
      setEquipos([]);
      return;
    }

    const fetchEquipos = async () => {
      const { data, error } = await supabase
        .from("equipos")
        .select("*")
        .eq("empresa_id", selectedEmpresa)
        .order("nombre");

      if (error) {
        toast.error("Error al cargar equipos");
        return;
      }

      setEquipos(data || []);
    };

    fetchEquipos();
  }, [selectedEmpresa]);

  // Cargar tablero y evaluaciones cuando cambia el equipo
  useEffect(() => {
    if (!selectedEquipo) {
      setTablero(null);
      setEvaluaciones([]);
      return;
    }

    const fetchTableroYEvaluaciones = async () => {
      const { data: tableroData, error: tableroError } = await supabase
        .from("tableros")
        .select("*")
        .eq("equipo_id", selectedEquipo)
        .maybeSingle();

      if (tableroError && tableroError.code !== 'PGRST116') {
        toast.error("Error al cargar tablero");
        return;
      }

      setTablero(tableroData);

      if (tableroData) {
        const { data: evalData, error: evalError } = await supabase
          .from("evaluaciones")
          .select("*")
          .eq("equipo_id", selectedEquipo);

        if (evalError) {
          toast.error("Error al cargar evaluaciones");
          return;
        }

        setEvaluaciones(evalData || []);
      }
    };

    fetchTableroYEvaluaciones();
  }, [selectedEquipo]);

  const handleCreateNineBox = async () => {
    if (!selectedEquipo || !selectedEmpresa) {
      toast.error("Selecciona empresa y equipo");
      return;
    }

    const equipoSeleccionado = equipos.find(e => e.id === selectedEquipo);
    if (!equipoSeleccionado) return;

    const { data, error } = await supabase
      .from("tableros")
      .insert({
        nombre: `Nine Box - ${equipoSeleccionado.nombre}`,
        equipo_id: selectedEquipo,
        empresa_id: selectedEmpresa,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al crear Nine Box");
      return;
    }

    setTablero(data);
    toast.success("Nine Box creado exitosamente");
  };

  // Realtime updates para evaluaciones
  useEffect(() => {
    if (!selectedEquipo) return;

    const channel = supabase
      .channel('evaluaciones-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evaluaciones',
          filter: `equipo_id=eq.${selectedEquipo}`,
        },
        () => {
          // Recargar evaluaciones cuando hay cambios
          supabase
            .from("evaluaciones")
            .select("*")
            .eq("equipo_id", selectedEquipo)
            .then(({ data }) => {
              if (data) setEvaluaciones(data);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedEquipo]);

  const getPotentialLevel = (score: number): 'Bajo' | 'Medio' | 'Alto' => {
    if (score > 2.5) return 'Alto';
    if (score > 1.5) return 'Medio';
    return 'Bajo';
  };

  const getPerformanceLevel = (score: number): 'Bajo' | 'Medio' | 'Alto' => {
    if (score >= 4) return 'Alto';
    if (score >= 3) return 'Medio';
    return 'Bajo';
  };

  const employees: Employee[] = useMemo(() => {
    return evaluaciones.map(ev => ({
      id: ev.id,
      name: ev.persona_nombre,
      manager: "HRBP",
      potential: getPotentialLevel(ev.potencial_score),
      performance: getPerformanceLevel(ev.desempeno_score),
      potentialScore: ev.potencial_score,
      performanceScore: ev.desempeno_score,
    }));
  }, [evaluaciones]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <OverrideProvider>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard HRBP</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCreateEmpresaDialogOpen(true)}>
              <Building2 className="w-4 h-4 mr-2" />
              Nueva Empresa
            </Button>
            <Button variant="outline" onClick={() => setIsCreateEquipoDialogOpen(true)} disabled={!selectedEmpresa}>
              <Users className="w-4 h-4 mr-2" />
              Nuevo Equipo
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Empresa y Equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Empresa</label>
                <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Equipo</label>
                <Select 
                  value={selectedEquipo} 
                  onValueChange={setSelectedEquipo}
                  disabled={!selectedEmpresa}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipos.map((equipo) => (
                      <SelectItem key={equipo.id} value={equipo.id}>
                        {equipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedEquipo && !tablero && (
              <Button onClick={handleCreateNineBox} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Crear Nine Box
              </Button>
            )}

            {tablero && (
              <Button onClick={() => setIsEvaluationDialogOpen(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Evaluación
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Nine Box Grid */}
        {tablero && (
          <Card>
            <CardHeader>
              <CardTitle>{tablero.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveNineBoxGrid employees={employees} />
            </CardContent>
          </Card>
        )}

        {/* Dialog para agregar evaluaciones */}
        {tablero && (
          <EvaluationDialog
            open={isEvaluationDialogOpen}
            onOpenChange={setIsEvaluationDialogOpen}
            equipoId={selectedEquipo}
            tableroId={tablero.id}
          />
        )}

        {/* Dialog para crear empresa */}
        <CreateEmpresaDialog
          open={isCreateEmpresaDialogOpen}
          onOpenChange={setIsCreateEmpresaDialogOpen}
          onCreated={(empresaId) => {
            setSelectedEmpresa(empresaId);
            setIsCreateEmpresaDialogOpen(false);
            // Recargar empresas
            supabase.from("empresas").select("*").order("nombre").then(({ data }) => {
              if (data) setEmpresas(data);
            });
          }}
        />

        {/* Dialog para crear equipo */}
        <CreateEquipoDialog
          open={isCreateEquipoDialogOpen}
          onOpenChange={setIsCreateEquipoDialogOpen}
          empresaId={selectedEmpresa}
          onCreated={(equipoId) => {
            setSelectedEquipo(equipoId);
            setIsCreateEquipoDialogOpen(false);
            // Recargar equipos
            supabase.from("equipos").select("*").eq("empresa_id", selectedEmpresa).order("nombre").then(({ data }) => {
              if (data) setEquipos(data);
            });
          }}
        />
        </div>
      </div>
    </OverrideProvider>
  );
};

export default HRBPDashboard;
