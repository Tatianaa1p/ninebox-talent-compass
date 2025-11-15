import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, LogOut, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useGaussAccess } from '@/hooks/useGaussAccess';
import { useCalibracionGaussQuery } from '@/hooks/queries/useCalibracionGaussQuery';
import { GaussUploadDialog } from '@/components/GaussUploadDialog';
import { GaussFilters } from '@/components/GaussFilters';
import { GaussChart } from '@/components/GaussChart';
import GaussCalibracionTableOptimized from '@/components/GaussCalibracionTableOptimized';
import GaussEmpleadosTableOptimized from '@/components/GaussEmpleadosTableOptimized';
import { GaussStats } from '@/components/GaussStats';
import { GaussTableroSelector } from '@/components/GaussTableroSelector';
import { exportEmpleadosToExcel } from '@/utils/gaussExport';
import { calcularPromediosPorPersona } from '@/utils/gaussCalculations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const CurvaGauss = () => {
  const navigate = useNavigate();
  const { signOut, user, loading: authLoading } = useAuth();
  const { hasAccess, isLoading: accessLoading, role, paisesAcceso } = useGaussAccess();
  
  const [filters, setFilters] = useState({
    familia_cargo: 'all',
    competencia: 'all',
    pais: 'all',
    equipo: 'all',
    seniority: 'all',
    posicion: 'all',
  });

  const [selectedPaisTablero, setSelectedPaisTablero] = useState('all');
  const [selectedTablero, setSelectedTablero] = useState('all');

  // Apply backend filtering for better performance
  const { data: calibraciones = [], isLoading } = useCalibracionGaussQuery({
    paisesAcceso: paisesAcceso.length > 0 ? paisesAcceso : undefined,
    tablero_id: selectedTablero,
    pais: filters.pais,
    equipo: filters.equipo
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [CurvaGauss] Estado:', {
      email: user?.email,
      userId: user?.id,
      hasAccess,
      role,
      paisesAcceso,
      calibracionesCount: calibraciones.length
    });
  }

  const handleTableroCreado = (tableroId: string, pais: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Tablero creado:', { tableroId, pais });
    }
    setSelectedPaisTablero(pais);
    setSelectedTablero(tableroId);
  };

  const [media, setMedia] = useState(2.5);
  const [desviacion, setDesviacion] = useState(0.5);

  useEffect(() => {
    const isFullyLoaded = !authLoading && !accessLoading;
    
    if (isFullyLoaded && !hasAccess) {
      navigate('/acceso-denegado');
    }
  }, [hasAccess, accessLoading, authLoading, navigate]);

  // Frontend filters for remaining criteria (backend already filtered by pais, tablero, equipo)
  const filteredCalibraciones = useMemo(() => {
    return calibraciones.filter(cal => {
      if (filters.familia_cargo !== 'all' && cal.familia_cargo !== filters.familia_cargo) return false;
      if (filters.competencia !== 'all' && cal.competencia !== filters.competencia) return false;
      if (filters.seniority !== 'all' && cal.seniority !== filters.seniority) return false;
      if (filters.posicion !== 'all' && cal.posicion !== filters.posicion) return false;
      return true;
    });
  }, [calibraciones, filters]);

  const empleadosConPromedio = useMemo(() => {
    return calcularPromediosPorPersona(filteredCalibraciones);
  }, [filteredCalibraciones]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    toast.success('Filtros aplicados');
  };


  const handleExportExcel = () => {
    if (empleadosConPromedio.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    exportEmpleadosToExcel(empleadosConPromedio);
    toast.success('Reporte descargado correctamente');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  // Mostrar loading mientras se verifica autenticación O permisos O datos
  if (authLoading || accessLoading || isLoading) {
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
          <h1 className="text-2xl font-bold">Curva de Gauss - Calibración de Competencias</h1>
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
        <div className="flex justify-between items-center">
          <GaussUploadDialog 
            paisesPermitidos={paisesAcceso} 
            onTableroCreado={handleTableroCreado}
          />
          <Button onClick={handleExportExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar reporte en Excel
          </Button>
        </div>

        {/* Only show selector when permissions are loaded */}
        {!accessLoading && (
          <>
            {console.log('🎨 [CurvaGauss] Renderizando GaussTableroSelector con:', {
              accessLoading,
              paisesAcceso,
              paisesAccesoLength: paisesAcceso.length
            })}
            <GaussTableroSelector
              selectedPais={selectedPaisTablero}
              selectedTablero={selectedTablero}
              onPaisChange={setSelectedPaisTablero}
              onTableroChange={setSelectedTablero}
              onTableroEliminado={() => toast.success('Tablero eliminado exitosamente')}
              paisesPermitidos={paisesAcceso}
            />
          </>
        )}

        <GaussStats empleados={empleadosConPromedio} />

        <GaussFilters
          calibraciones={calibraciones}
          filters={filters}
          onFilterChange={handleFilterChange}
          media={media}
          desviacion={desviacion}
          onMediaChange={setMedia}
          onDesviacionChange={setDesviacion}
          onApplyFilters={handleApplyFilters}
        />

        <div className="border rounded-lg p-4 bg-card">
          <GaussChart empleados={empleadosConPromedio} media={media} desviacion={desviacion} />
        </div>

        <Tabs defaultValue="empleados" className="w-full">
          <TabsList>
            <TabsTrigger value="empleados">Vista por Empleados</TabsTrigger>
            <TabsTrigger value="competencias">Vista por Competencias</TabsTrigger>
          </TabsList>
          <TabsContent value="empleados" className="mt-4">
            <GaussEmpleadosTableOptimized empleados={empleadosConPromedio} />
          </TabsContent>
          <TabsContent value="competencias" className="mt-4">
            <GaussCalibracionTableOptimized calibraciones={filteredCalibraciones} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CurvaGauss;
