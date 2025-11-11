import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTablerosPaisQuery } from '@/hooks/queries/useTablerosPaisQuery';
import { Loader2 } from 'lucide-react';
import { EliminarTableroDialog } from './EliminarTableroDialog';

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
  
  // Filter tableros by allowed countries - case insensitive comparison
  const tableros = allTableros.filter(tablero => 
    paisesPermitidos.length === 0 || // Allow all if no restrictions (manager)
    !tablero.pais || // Allow if no country assigned
    paisesPermitidos.some(p => p.toLowerCase() === tablero.pais?.toLowerCase()) // Case-insensitive match
  );
  
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
