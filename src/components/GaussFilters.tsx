import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalibracionGauss, COMPETENCIAS } from '@/types/gauss';

interface GaussFiltersProps {
  calibraciones: CalibracionGauss[];
  filters: {
    familia_cargo: string;
    competencia: string;
    pais: string;
    equipo: string;
    seniority: string;
    posicion: string;
  };
  onFilterChange: (key: string, value: string) => void;
  media: number;
  desviacion: number;
  onMediaChange: (value: number) => void;
  onDesviacionChange: (value: number) => void;
  onApplyFilters: () => void;
}

export const GaussFilters = ({
  calibraciones,
  filters,
  onFilterChange,
  media,
  desviacion,
  onMediaChange,
  onDesviacionChange,
  onApplyFilters,
}: GaussFiltersProps) => {
  // Memoize unique values calculation for better performance
  const uniqueValues = useMemo(() => {
    return (key: keyof CalibracionGauss) => {
      return Array.from(new Set(calibraciones.map(c => String(c[key])))).sort();
    };
  }, [calibraciones]);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="font-semibold">Filtros</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Familia de Cargo</Label>
          <Select value={filters.familia_cargo} onValueChange={(v) => onFilterChange('familia_cargo', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniqueValues('familia_cargo').map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Competencia</Label>
          <Select value={filters.competencia} onValueChange={(v) => onFilterChange('competencia', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {COMPETENCIAS.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>País</Label>
          <Select value={filters.pais} onValueChange={(v) => onFilterChange('pais', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueValues('pais').map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Equipo</Label>
          <Select value={filters.equipo} onValueChange={(v) => onFilterChange('equipo', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueValues('equipo').map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Seniority</Label>
          <Select value={filters.seniority} onValueChange={(v) => onFilterChange('seniority', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueValues('seniority').map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Posición</Label>
          <Select value={filters.posicion} onValueChange={(v) => onFilterChange('posicion', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniqueValues('posicion').map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="font-semibold mb-3">Parámetros de Curva</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Media Objetivo</Label>
            <Input
              type="number"
              step="0.1"
              min="1.0"
              max="4.0"
              value={media}
              onChange={(e) => onMediaChange(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Desviación Estándar</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max="2.0"
              value={desviacion}
              onChange={(e) => onDesviacionChange(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onApplyFilters} variant="default">
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
};
