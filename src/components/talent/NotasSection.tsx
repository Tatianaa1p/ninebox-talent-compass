import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MessageSquare, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TalentNota, TipoTalentPlan } from '@/types/talentPlan';
import { useAddNota } from '@/hooks/queries/useTalentPlans';

interface Props {
  tableroId: string;
  empleadoId: string;
  tipo: TipoTalentPlan;
  notas: TalentNota[];
  variant?: 'desarrollo' | 'riesgo';
}

export const NotasSection = ({ tableroId, empleadoId, tipo, notas, variant = 'desarrollo' }: Props) => {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const addM = useAddNota(tableroId);

  const handleAdd = async () => {
    if (!text.trim()) return;
    await addM.mutateAsync({ empleado_id: empleadoId, tipo, contenido: text.trim() });
    setText('');
    setAdding(false);
  };

  const isRisk = variant === 'riesgo';
  const Icon = isRisk ? MessageSquare : StickyNote;
  const title = isRisk ? 'Historial de conversaciones' : 'Notas y comentarios';
  const borderColor = isRisk ? 'border-l-warning' : 'border-l-success';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </h4>
        <Button size="sm" variant="ghost" onClick={() => setAdding((v) => !v)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Agregar nota
        </Button>
      </div>

      {notas.length === 0 && !adding && (
        <p className="text-sm italic text-muted-foreground">Sin notas registradas</p>
      )}

      <ul className="space-y-2">
        {notas.map((n) => (
          <li key={n.id} className={cn('border-l-4 pl-3 py-1', borderColor)}>
            <p className="text-sm whitespace-pre-wrap">{n.contenido}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {n.autor_email || 'Anónimo'} · {new Date(n.created_at).toLocaleString('es-AR')}
            </p>
          </li>
        ))}
      </ul>

      {adding && (
        <div className="space-y-2 p-3 rounded-md border bg-card">
          <Textarea placeholder="Escribir una nota..." value={text} onChange={(e) => setText(e.target.value)} rows={3} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAdd} disabled={addM.isPending}>Guardar nota</Button>
          </div>
        </div>
      )}
    </div>
  );
};
