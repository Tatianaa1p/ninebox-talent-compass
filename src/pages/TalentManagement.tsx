import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  AlertTriangle,
  Grid3x3,
  LogOut,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useEmpresasQuery } from '@/hooks/queries/useEmpresasQuery';
import { useEquiposQuery } from '@/hooks/queries/useEquiposQuery';
import { useTablerosQuery } from '@/hooks/queries/useTablerosQuery';
import { usePeriodosQuery } from '@/hooks/queries/usePeriodosQuery';
import { PeriodoSelector } from '@/components/PeriodoSelector';
import { useTalentPlans } from '@/hooks/queries/useTalentPlans';
import { HighPotentialCard } from '@/components/talent/HighPotentialCard';
import { FollowUpRow } from '@/components/talent/FollowUpRow';

const TalentManagement = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { permissions, loading: permissionsLoading, hasAccess } = useUserPermissions();

  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState<number>(new Date().getFullYear());
  const [selectedEquipo, setSelectedEquipo] = useState('');
  const [selectedTablero, setSelectedTablero] = useState('');

  const { data: empresas = [], isLoading: loadingEmpresas } = useEmpresasQuery(
    !permissionsLoading && !!user,
  );
  const { data: equipos = [] } = useEquiposQuery(selectedEmpresa);
  const { data: periodosDisponibles = [] } = usePeriodosQuery(selectedEmpresa);
  const { data: tableros = [] } = useTablerosQuery(selectedEquipo, selectedPeriodo);

  useEffect(() => {
    if (periodosDisponibles.length > 0 && !periodosDisponibles.includes(selectedPeriodo)) {
      setSelectedPeriodo(periodosDisponibles[0]);
    }
  }, [periodosDisponibles, selectedPeriodo]);

  const filteredEmpresas = useMemo(() => {
    if (!permissions) return [];
    const unique = empresas.reduce((acc: typeof empresas, cur) => {
      if (!acc.find((e) => e.nombre === cur.nombre)) acc.push(cur);
      return acc;
    }, [] as typeof empresas);
    return unique.filter((e) => hasAccess(e.nombre));
  }, [empresas, permissions, hasAccess]);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    if (equipos.length > 0) setSelectedEquipo(equipos[0].id);
    else setSelectedEquipo('');
  }, [equipos]);

  useEffect(() => {
    if (tableros.length > 0) setSelectedTablero(tableros[0].id);
    else setSelectedTablero('');
  }, [tableros]);

  const { data: empleadosConPlan = [], isLoading } = useTalentPlans(selectedTablero || null);

  const altoPotencial = useMemo(
    () => empleadosConPlan.filter((e) => e.tipo === 'desarrollo'),
    [empleadosConPlan],
  );
  const seguimiento = useMemo(
    () => empleadosConPlan.filter((e) => e.tipo === 'riesgo'),
    [empleadosConPlan],
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserDisplayName = () => {
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name
        .split('.')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
    }
    return 'Usuario';
  };

  if (permissionsLoading || loadingEmpresas) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando datos...
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
                <h1 className="text-2xl font-bold">Gestión de Talento</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-2 px-2 py-1 bg-green-500/10 text-green-600 rounded-md text-sm">
                  ✓ {getUserDisplayName()}
                </span>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectValue
                    placeholder={
                      filteredEmpresas.length === 0 ? 'Sin empresas' : 'Seleccionar empresa'
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

            <div>
              <label className="text-sm font-medium mb-2 block">Equipo</label>
              <Select
                value={selectedEquipo}
                onValueChange={setSelectedEquipo}
                disabled={!selectedEmpresa}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedEmpresa
                        ? 'Selecciona empresa primero'
                        : equipos.length === 0
                        ? 'Sin equipos'
                        : 'Seleccionar equipo'
                    }
                  />
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
              <Select
                value={selectedTablero}
                onValueChange={setSelectedTablero}
                disabled={!selectedEquipo}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      tableros.length === 0
                        ? 'No hay tableros'
                        : 'Seleccionar tablero'
                    }
                  />
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
          </div>
        </Card>

        {selectedTablero ? (
          isLoading ? (
            <Card className="p-12 text-center text-muted-foreground">Cargando empleados...</Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted">
                      <Users className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Empleados gestionados</p>
                      <p className="text-2xl font-bold">{empleadosConPlan.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-success/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-success/15">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Alto potencial</p>
                      <p className="text-2xl font-bold text-success">{altoPotencial.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 border-destructive/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-destructive/15">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">En seguimiento</p>
                      <p className="text-2xl font-bold text-destructive">{seguimiento.length}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Tabs defaultValue="alto" className="w-full">
                <TabsList>
                  <TabsTrigger value="alto" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Alto Potencial
                    <Badge variant="outline" className="bg-success/15 text-success border-success/30">
                      {altoPotencial.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="seguimiento" className="gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Seguimiento
                    <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">
                      {seguimiento.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="alto" className="mt-4">
                  {altoPotencial.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground">
                      No hay empleados de alto potencial en este tablero.
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {altoPotencial.map((emp) => (
                        <HighPotentialCard key={emp.id} emp={emp} tableroId={selectedTablero} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="seguimiento" className="mt-4">
                  {seguimiento.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground">
                      No hay empleados en seguimiento en este tablero.
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {seguimiento.map((emp) => (
                        <FollowUpRow key={emp.id} emp={emp} tableroId={selectedTablero} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              Selecciona una empresa, equipo y tablero para ver los planes
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TalentManagement;
