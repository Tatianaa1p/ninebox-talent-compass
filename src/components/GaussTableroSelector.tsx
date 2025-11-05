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
}

const PAISES = ['all', 'Argentina', 'Uruguay', 'Paraguay', 'Chile'] as const;

export const GaussTableroSelector = ({
  selectedPais,
  selectedTablero,
  onPaisChange,
  onTableroChange,
  onTableroEliminado,
}: GaussTableroSelectorProps) => {
  const { data: tableros = [], isLoading } = useTablerosPaisQuery(selectedPais);

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
                {PAISES.filter(p => p !== 'all').map(pais => (
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
          <div className="flex justify-end pt-2">
            <EliminarTableroDialog
              tableroId={selectedTablero}
              tableroNombre={tableroSeleccionado.nombre}
              onTableroEliminado={handleTableroEliminado}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
