import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Circle, Clock, CheckCircle2, Trash2, Plus, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TalentAccion,
  AccionEstado,
  TipoTalentPlan,
} from '@/types/talentPlan';
import {
  useAddAccion,
  useUpdateAccionEstado,
  useUpdateAccionDescripcion,
  useDeleteAccion,
} from '@/hooks/queries/useTalentPlans';

const NEXT: Record<AccionEstado, AccionEstado> = {
  pendiente: 'en_curso',
  en_curso: 'completado',
  completado: 'pendiente',
};

const StateIcon = ({ estado }: { estado: AccionEstado }) => {
  if (estado === 'completado') return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (estado === 'en_curso') return <Clock className="h-4 w-4 text-warning" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
};

interface Props {
  tableroId: string;
  empleadoId: string;
  tipo: TipoTalentPlan;
  acciones: TalentAccion[];
}

export const AccionesSection = ({ tableroId, empleadoId, tipo, acciones }: Props) => {
  const [adding, setAdding] = useState(false);
  const [desc, setDesc] = useState('');
  const [fecha, setFecha] = useState('');
  const [resp, setResp] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const addM = useAddAccion(tableroId);
  const updM = useUpdateAccionEstado(tableroId);
  const updDescM = useUpdateAccionDescripcion();
  const delM = useDeleteAccion(tableroId);

  const saveEdit = (id: string) => {
    if (!editingText.trim()) return;
    updDescM.mutate({ id, descripcion: editingText.trim(), tableroId });
    setEditingId(null);
    setEditingText('');
  };

  const handleAdd = async () => {
    if (!desc.trim()) return;
    await addM.mutateAsync({
      empleado_id: empleadoId,
      tipo,
      descripcion: desc.trim(),
      fecha_limite: fecha || null,
      responsable: resp || null,
    });
    setDesc(''); setFecha(''); setResp(''); setAdding(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Acciones de seguimiento</h4>
        <Button size="sm" variant="ghost" onClick={() => setAdding((v) => !v)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
        </Button>
      </div>

      {acciones.length === 0 && !adding && (
        <p className="text-sm italic text-muted-foreground">Sin acciones cargadas</p>
      )}

      <ul className="space-y-1">
        {acciones.map((a) => (
          <li
            key={a.id}
            className="group flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
          >
            <button
              onClick={() => updM.mutate({ id: a.id, estado: NEXT[a.estado] })}
              className="shrink-0"
              aria-label="Cambiar estado"
            >
              <StateIcon estado={a.estado} />
            </button>
            <div className="flex-1 min-w-0">
              {editingId === a.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    autoFocus
                    className="text-sm h-7 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(a.id);
                      if (e.key === 'Escape') { setEditingId(null); setEditingText(''); }
                    }}
                  />
                  <button onClick={() => saveEdit(a.id)} aria-label="Guardar" className="text-success hover:opacity-80">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setEditingId(null); setEditingText(''); }} aria-label="Cancelar" className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <p className={cn('text-sm truncate', a.estado === 'completado' && 'line-through text-muted-foreground')}>
                    {a.descripcion}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.responsable && <span>{a.responsable}</span>}
                    {a.responsable && a.fecha_limite && <span> · </span>}
                    {a.fecha_limite && <span>{new Date(a.fecha_limite).toLocaleDateString('es-AR')}</span>}
                  </p>
                </>
              )}
            </div>
            {editingId !== a.id && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => { setEditingId(a.id); setEditingText(a.descripcion); }}
                  className="text-muted-foreground hover:text-primary"
                  aria-label="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => delM.mutate(a.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding && (
        <div className="space-y-2 p-3 rounded-md border bg-card">
          <Input placeholder="Descripción" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <Input placeholder="Responsable" value={resp} onChange={(e) => setResp(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAdd} disabled={addM.isPending}>Guardar</Button>
          </div>
        </div>
      )}
    </div>
  );
};
