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
import { GaussCalibracionTable } from '@/components/GaussCalibracionTable';
import { GaussEmpleadosTable } from '@/components/GaussEmpleadosTable';
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
  const { data: calibraciones = [], isLoading } = useCalibracionGaussQuery();

  console.log('========================================');
  console.log('🔍 CURVA GAUSS - DEBUG DE AUTENTICACIÓN');
  console.log('========================================');
  console.log('📧 Email autenticado:', user?.email);
  console.log('🆔 User ID:', user?.id);
  console.log('🔄 Auth loading:', authLoading);
  console.log('🔄 Access loading:', accessLoading);
  console.log('✅ ¿Tiene acceso?:', hasAccess);
  console.log('👤 Rol asignado:', role);
  console.log('🌍 Países de acceso:', paisesAcceso);
  console.log('📊 Países de acceso length:', paisesAcceso.length);
  console.log('🔐 ¿Países vacíos?:', paisesAcceso.length === 0);
  console.log('========================================');

  // Track when paisesAcceso changes
  useEffect(() => {
    console.log('🔄 [CurvaGauss] paisesAcceso ACTUALIZADO:', {
      paisesAcceso,
      length: paisesAcceso.length,
      timestamp: new Date().toISOString()
    });
  }, [paisesAcceso]);

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

  const handleTableroCreado = (tableroId: string, pais: string) => {
    console.log('📋 Tablero creado, seleccionando automáticamente:', { tableroId, pais });
    setSelectedPaisTablero(pais);
    setSelectedTablero(tableroId);
  };

  const [media, setMedia] = useState(2.5); // Media objetivo por defecto
  const [desviacion, setDesviacion] = useState(0.5); // Desviación estándar por defecto

  useEffect(() => {
    console.log('[CurvaGauss useEffect] Checking access...');
    console.log('[CurvaGauss useEffect] authLoading:', authLoading);
    console.log('[CurvaGauss useEffect] accessLoading:', accessLoading);
    console.log('[CurvaGauss useEffect] hasAccess:', hasAccess);
    
    // CRÍTICO: Esperar a que AMBOS loading states sean false antes de verificar acceso
    const isFullyLoaded = !authLoading && !accessLoading;
    
    if (isFullyLoaded && !hasAccess) {
      console.log('[CurvaGauss useEffect] ❌ REDIRECTING to /acceso-denegado - Access denied!');
      navigate('/acceso-denegado');
    } else if (isFullyLoaded && hasAccess) {
      console.log('[CurvaGauss useEffect] ✅ Access granted!');
    } else if (!isFullyLoaded) {
      console.log('[CurvaGauss useEffect] ⏳ Waiting for auth and permissions to load...');
    }
  }, [hasAccess, accessLoading, authLoading, navigate]);

  const filteredCalibraciones = useMemo(() => {
    console.log('🔍 [CurvaGauss] FILTRANDO CALIBRACIONES:', {
      total: calibraciones.length,
      paisesAcceso,
      paisesAccesoLength: paisesAcceso.length,
      selectedTablero,
      filters,
      timestamp: new Date().toISOString()
    });

    const filtered = calibraciones.filter(cal => {
      // Filter by allowed countries first (security) - normalize to lowercase for comparison
      if (paisesAcceso.length > 0 && !paisesAcceso.map(p => p.toLowerCase()).includes(cal.pais.toLowerCase())) {
        console.log('❌ [CurvaGauss] Rechazado por país:', cal.pais, 'permitidos:', paisesAcceso);
        return false;
      }
      
      // Filter by tablero
      if (selectedTablero !== 'all' && cal.tablero_id !== selectedTablero) return false;
      
      // Then apply other filters
      if (filters.familia_cargo !== 'all' && cal.familia_cargo !== filters.familia_cargo) return false;
      if (filters.competencia !== 'all' && cal.competencia !== filters.competencia) return false;
      if (filters.pais !== 'all' && cal.pais !== filters.pais) return false;
      if (filters.equipo !== 'all' && cal.equipo !== filters.equipo) return false;
      if (filters.seniority !== 'all' && cal.seniority !== filters.seniority) return false;
      if (filters.posicion !== 'all' && cal.posicion !== filters.posicion) return false;
      return true;
    });

    console.log('✅ [CurvaGauss] Calibraciones después de filtro:', {
      filtradas: filtered.length,
      original: calibraciones.length
    });
    return filtered;
  }, [calibraciones, filters, selectedTablero, paisesAcceso]);

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
            <GaussEmpleadosTable empleados={empleadosConPromedio} />
          </TabsContent>
          <TabsContent value="competencias" className="mt-4">
            <GaussCalibracionTable calibraciones={filteredCalibraciones} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CurvaGauss;
