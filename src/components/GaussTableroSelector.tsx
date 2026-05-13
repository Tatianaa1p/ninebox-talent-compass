import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTablerosPaisQuery } from '@/hooks/queries/useTablerosPaisQuery';
import { Loader2 } from 'lucide-react';
import { EliminarTableroDialog } from './EliminarTableroDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

interface GaussTableroSelectorProps {
  selectedPais: string;
  selectedTablero: string;
  onPaisChange: (pais: string) => void;
  onTableroChange: (tablero: string) => void;
  onTableroEliminado?: () => void;
  paisesPermitidos: string[];
}

export const GaussTableroSelector = ({
  selectedPais,
  selectedTablero,
  onPaisChange,
  onTableroChange,
  onTableroEliminado,
  paisesPermitidos,
}: GaussTableroSelectorProps) => {
  const { data: allTableros = [], isLoading } = useTablerosPaisQuery(selectedPais);
  
  if (process.env.NODE_ENV === 'development') {
    useEffect(() => {
      console.log('🔍 [GaussTableroSelector] Estado:', {
        paisesPermitidos,
        isLoading,
        selectedPais,
        tablerosCount: allTableros.length
      });
    }, [paisesPermitidos, isLoading, selectedPais, allTableros.length]);
  }
  
  // Filter tableros by allowed countries - case insensitive comparison
  const tableros = allTableros.filter(tablero => {
    if (!tablero.pais) return true;
    if (paisesPermitidos.length === 0) return false;
    return paisesPermitidos.some(p => p.toLowerCase() === tablero.pais?.toLowerCase());
  });
  
  // Filter countries based on user permissions
  const paisesDisponibles = paisesPermitidos.length > 0 
    ? ['all', ...paisesPermitidos]
    : ['all'];

  const handlePaisChange = (value: string) => {
    onPaisChange(value);
    onTableroChange('all'); // Reset tablero when país changes
  };

  const handleTableroEliminado = () => {
    onTableroChange('all');
    onTableroEliminado?.();
  };

  const tableroSeleccionado = tableros.find(t => t.id === selectedTablero);

  // Show skeleton while permissions are loading
  if (isLoading || paisesPermitidos.length === 0) {
    console.log('⏳ [GaussTableroSelector] Mostrando skeleton - permisos aún no cargados');
    return (
      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Tablero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>País</Label>
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Label>Tablero</Label>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Cargando permisos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtrar por Tablero</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>País</Label>
            <Select value={selectedPais} onValueChange={handlePaisChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los países" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los países</SelectItem>
                {paisesPermitidos.map(pais => (
                  <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tablero</Label>
            <Select 
              value={selectedTablero} 
              onValueChange={onTableroChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Cargando...' : 'Todos los tableros'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tableros</SelectItem>
                {isLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  tableros.map(tablero => (
                    <SelectItem key={tablero.id} value={tablero.id}>
                      {tablero.nombre} {tablero.pais && `(${tablero.pais})`}
                      {(tablero as any).es_espejo && (
                        <span className="text-xs text-muted-foreground ml-1">(Ninebox)</span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {tableros.length > 0 && selectedTablero === 'all' && (
          <p className="text-sm text-muted-foreground">
            📊 {tableros.length} tablero{tableros.length !== 1 ? 's' : ''} disponible{tableros.length !== 1 ? 's' : ''}
          </p>
        )}

        {selectedTablero !== 'all' && tableroSeleccionado && (
          <>
            {/* Only show delete button if user has access to this country - case insensitive */}
            {(paisesPermitidos.some(p => p.toLowerCase() === tableroSeleccionado.pais?.toLowerCase()) || paisesPermitidos.length === 0) && (
              <div className="flex justify-end pt-2">
                <EliminarTableroDialog
                  tableroId={selectedTablero}
                  tableroNombre={tableroSeleccionado.nombre}
                  onTableroEliminado={handleTableroEliminado}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
