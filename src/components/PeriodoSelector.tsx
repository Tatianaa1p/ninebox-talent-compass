import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface PeriodoSelectorProps {
  value: number | undefined;
  onChange: (periodo: number) => void;
  periodos: number[];
  disabled?: boolean;
  label?: string;
}

export const PeriodoSelector = ({
  value,
  onChange,
  periodos,
  disabled,
  label = 'Período',
}: PeriodoSelectorProps) => {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <Select
        value={value ? String(value) : ''}
        onValueChange={(v) => onChange(Number(v))}
        disabled={disabled || periodos.length === 0}
      >
        <SelectTrigger>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Seleccionar período" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {periodos.map((p) => (
            <SelectItem key={p} value={String(p)}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
