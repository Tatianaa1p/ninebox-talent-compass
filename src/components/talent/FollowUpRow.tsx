import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { EmpleadoConPlan, PipEstado, PIP_ESTADO_LABELS } from '@/types/talentPlan';
import { useUpsertTalentPlan } from '@/hooks/queries/useTalentPlans';
import { AccionesSection } from './AccionesSection';
import { NotasSection } from './NotasSection';
import { DownloadPlanButton } from './DownloadPlanButton';
import { cn } from '@/lib/utils';

interface Props {
  emp: EmpleadoConPlan;
  tableroId: string;
}

const pipPillClass = (estado: PipEstado | null | undefined) => {
  switch (estado) {
    case 'pendiente': return 'bg-muted text-muted-foreground border-border';
    case 'en_curso': return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
    case 'completado': return 'bg-success/15 text-success border-success/30';
    case 'cancelado': return 'bg-destructive/15 text-destructive border-destructive/30';
    default: return '';
  }
};

export const FollowUpRow = ({ emp, tableroId }: Props) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [objetivo, setObjetivo] = useState(emp.plan?.pip_objetivo ?? '');
  const [inicio, setInicio] = useState(emp.plan?.pip_fecha_inicio ?? '');
  const [fin, setFin] = useState(emp.plan?.pip_fecha_fin ?? '');
  const [estado, setEstado] = useState<PipEstado>(emp.plan?.pip_estado ?? 'pendiente');
  const [notas, setNotas] = useState(emp.plan?.notas ?? '');

  const upsert = useUpsertTalentPlan(tableroId);

  const isRiesgo = emp.cuadrante === 'Riesgo';
  const badgeClass = isRiesgo
    ? 'bg-destructive/15 text-destructive border-destructive/30'
    : 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30';

  const handleSave = async () => {
    await upsert.mutateAsync({
      empleado_id: emp.id,
      tipo: 'riesgo',
      pip_objetivo: objetivo || null,
      pip_fecha_inicio: inicio || null,
      pip_fecha_fin: fin || null,
      pip_estado: estado,
      notas: notas || null,
    });
    setEditing(false);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-12 gap-3 items-center p-3 hover:bg-muted/30">
        <div className="col-span-3 min-w-0">
          <p className="font-medium truncate">{emp.nombre}</p>
          <p className="text-xs text-muted-foreground">
            P {emp.performance.toFixed(1)} · Pot {emp.potencial.toFixed(1)}
          </p>
        </div>
        <div className="col-span-2">
          <Badge variant="outline" className={cn('border', badgeClass)}>
            {emp.cuadrante}
          </Badge>
        </div>
        <div className="col-span-2">
          {emp.plan?.pip_estado ? (
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs border', pipPillClass(emp.plan.pip_estado))}>
              {PIP_ESTADO_LABELS[emp.plan.pip_estado]}
            </span>
          ) : (
            <span className="text-xs italic text-muted-foreground">Sin PIP</span>
          )}
        </div>
        <div className="col-span-2 text-sm text-muted-foreground">
          {emp.plan?.pip_fecha_fin
            ? new Date(emp.plan.pip_fecha_fin).toLocaleDateString('es-AR')
            : '—'}
        </div>
        <div className="col-span-2 text-sm text-muted-foreground">
          {emp.acciones.length} acción(es)
        </div>
        <div className="col-span-1 flex justify-end">
          <Button size="icon" variant="ghost" onClick={() => setOpen((v) => !v)}>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t p-4 space-y-4 bg-card">
          <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Plan de Mejora (PIP)</h4>
              {!editing && (
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar PIP
                </Button>
              )}
            </div>

            {editing ? (
              <div className="space-y-2">
                <Textarea placeholder="Objetivo del PIP" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} rows={2} />
                <div className="grid grid-cols-3 gap-2">
                  <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
                  <Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
                  <Select value={estado} onValueChange={(v) => setEstado(v as PipEstado)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PIP_ESTADO_LABELS) as PipEstado[]).map((k) => (
                        <SelectItem key={k} value={k}>{PIP_ESTADO_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea placeholder="Notas adicionales" value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
                  <Button size="sm" onClick={handleSave} disabled={upsert.isPending}>Guardar PIP</Button>
                </div>
              </div>
            ) : (
              <div className="text-sm space-y-1">
                {emp.plan?.pip_objetivo ? (
                  <p><span className="font-medium">Objetivo:</span> {emp.plan.pip_objetivo}</p>
                ) : null}
                {(emp.plan?.pip_fecha_inicio || emp.plan?.pip_fecha_fin) && (
                  <p>
                    <span className="font-medium">Fechas:</span>{' '}
                    {emp.plan?.pip_fecha_inicio ? new Date(emp.plan.pip_fecha_inicio).toLocaleDateString('es-AR') : '—'}
                    {' → '}
                    {emp.plan?.pip_fecha_fin ? new Date(emp.plan.pip_fecha_fin).toLocaleDateString('es-AR') : '—'}
                  </p>
                )}
                {emp.plan?.notas ? (
                  <p><span className="font-medium">Notas:</span> {emp.plan.notas}</p>
                ) : null}
                {!emp.plan?.pip_objetivo && !emp.plan?.pip_fecha_inicio && !emp.plan?.pip_fecha_fin && !emp.plan?.notas && (
                  <p className="italic text-muted-foreground">Sin PIP cargado</p>
                )}
              </div>
            )}
          </div>

          <AccionesSection
            tableroId={tableroId}
            empleadoId={emp.id}
            tipo="riesgo"
            acciones={emp.acciones}
          />

          <NotasSection
            tableroId={tableroId}
            empleadoId={emp.id}
            tipo="riesgo"
            notas={emp.notas}
            variant="riesgo"
          />
        </div>
      )}
    </div>
  );
};
