import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGaussAccess } from '@/hooks/useGaussAccess';
import { useCalibracionGaussQuery, useDeleteAllCalibraciones } from '@/hooks/queries/useCalibracionGaussQuery';
import { GaussUploadDialog } from '@/components/GaussUploadDialog';
import { GaussFilters } from '@/components/GaussFilters';
import { GaussChart } from '@/components/GaussChart';
import { GaussCalibracionTable } from '@/components/GaussCalibracionTable';
import { GaussStats } from '@/components/GaussStats';
import { exportCalibracionesToCSV } from '@/utils/gaussExport';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const CurvaGauss = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { hasAccess, isLoading: accessLoading, role } = useGaussAccess();
  const { data: calibraciones = [], isLoading } = useCalibracionGaussQuery();
  const deleteAll = useDeleteAllCalibraciones();

  console.log('[CurvaGauss] === DEBUG INFO ===');
  console.log('[CurvaGauss] 1. Current user email:', user?.email);
  console.log('[CurvaGauss] 2. User ID:', user?.id);
  console.log('[CurvaGauss] 3. hasAccess:', hasAccess);
  console.log('[CurvaGauss] 4. role:', role);
  console.log('[CurvaGauss] 5. accessLoading:', accessLoading);
  console.log('[CurvaGauss] ====================');

  const [filters, setFilters] = useState({
    familia_cargo: 'all',
    competencia: 'all',
    pais: 'all',
    equipo: 'all',
    seniority: 'all',
    posicion: 'all',
  });

  const [media, setMedia] = useState(3.0);
  const [desviacion, setDesviacion] = useState(0.5);

  useEffect(() => {
    console.log('[CurvaGauss useEffect] Checking access...');
    console.log('[CurvaGauss useEffect] accessLoading:', accessLoading);
    console.log('[CurvaGauss useEffect] hasAccess:', hasAccess);
    
    if (!accessLoading && !hasAccess) {
      console.log('[CurvaGauss useEffect] ❌ REDIRECTING to /acceso-denegado - Access denied!');
      navigate('/acceso-denegado');
    } else if (!accessLoading && hasAccess) {
      console.log('[CurvaGauss useEffect] ✅ Access granted!');
    }
  }, [hasAccess, accessLoading, navigate]);

  const filteredCalibraciones = useMemo(() => {
    return calibraciones.filter(cal => {
      if (filters.familia_cargo !== 'all' && cal.familia_cargo !== filters.familia_cargo) return false;
      if (filters.competencia !== 'all' && cal.competencia !== filters.competencia) return false;
      if (filters.pais !== 'all' && cal.pais !== filters.pais) return false;
      if (filters.equipo !== 'all' && cal.equipo !== filters.equipo) return false;
      if (filters.seniority !== 'all' && cal.seniority !== filters.seniority) return false;
      if (filters.posicion !== 'all' && cal.posicion !== filters.posicion) return false;
      return true;
    });
  }, [calibraciones, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    toast.success('Filtros aplicados');
  };

  const handleForzarCurva = () => {
    toast.info('Función "Forzar Curva" en desarrollo');
  };

  const handleExport = () => {
    if (filteredCalibraciones.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    exportCalibracionesToCSV(filteredCalibraciones);
    toast.success('Exportación completada');
  };

  const handleDeleteAll = () => {
    if (confirm('¿Estás seguro de eliminar todas las calibraciones? Esta acción no se puede deshacer.')) {
      deleteAll.mutate();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (accessLoading || isLoading) {
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
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Volver al Dashboard
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <GaussUploadDialog />
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button onClick={handleDeleteAll} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar Todo
            </Button>
          </div>
        </div>

        <GaussStats calibraciones={filteredCalibraciones} />

        <GaussFilters
          calibraciones={calibraciones}
          filters={filters}
          onFilterChange={handleFilterChange}
          media={media}
          desviacion={desviacion}
          onMediaChange={setMedia}
          onDesviacionChange={setDesviacion}
          onApplyFilters={handleApplyFilters}
          onForzarCurva={handleForzarCurva}
        />

        <div className="border rounded-lg p-4 bg-card">
          <GaussChart calibraciones={filteredCalibraciones} media={media} desviacion={desviacion} />
        </div>

        <GaussCalibracionTable calibraciones={filteredCalibraciones} />
      </main>
    </div>
  );
};

export default CurvaGauss;
