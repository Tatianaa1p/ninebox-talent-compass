import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { EmpleadoConPlan } from '@/types/talentPlan';
import { useUpsertTalentPlan } from '@/hooks/queries/useTalentPlans';
import { AccionesSection } from './AccionesSection';
import { NotasSection } from './NotasSection';
import { cn } from '@/lib/utils';

interface Props {
  emp: EmpleadoConPlan;
  tableroId: string;
}

export const HighPotentialCard = ({ emp, tableroId }: Props) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [carrera, setCarrera] = useState(emp.plan?.plan_carrera ?? '');
  const [mentor, setMentor] = useState(emp.plan?.mentor ?? '');
  const [proyectos, setProyectos] = useState(emp.plan?.proyectos_clave ?? '');
  const [notas, setNotas] = useState(emp.plan?.notas ?? '');

  const upsert = useUpsertTalentPlan(tableroId);

  const isEstrategico = emp.cuadrante === 'Talento Estratégico';
  const badgeClass = isEstrategico
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    : 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30';

  const pendientes = emp.acciones.filter((a) => a.estado !== 'completado').length;

  const handleSave = async () => {
    await upsert.mutateAsync({
      empleado_id: emp.id,
      tipo: 'desarrollo',
      plan_carrera: carrera || null,
      mentor: mentor || null,
      proyectos_clave: proyectos || null,
      notas: notas || null,
    });
    setEditing(false);
  };

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{emp.nombre}</h3>
            <Badge variant="outline" className={cn('border', badgeClass)}>
              {emp.cuadrante}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Performance {emp.performance.toFixed(1)} · Potencial {emp.potencial.toFixed(1)}
            {pendientes > 0 && <> · <span className="text-foreground font-medium">{pendientes} acción(es) pendiente(s)</span></>}
          </p>
        </div>
        <Button size="icon" variant="ghost" onClick={() => setOpen((v) => !v)} aria-label="Expandir">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Plan de desarrollo</h4>
              {!editing && (
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
              )}
            </div>

            {editing ? (
              <div className="space-y-2">
                <Textarea placeholder="Plan de carrera" value={carrera} onChange={(e) => setCarrera(e.target.value)} rows={2} />
                <Input placeholder="Mentor asignado" value={mentor} onChange={(e) => setMentor(e.target.value)} />
                <Textarea placeholder="Proyectos clave" value={proyectos} onChange={(e) => setProyectos(e.target.value)} rows={2} />
                <Textarea placeholder="Notas generales" value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
                  <Button size="sm" onClick={handleSave} disabled={upsert.isPending}>Guardar plan</Button>
                </div>
              </div>
            ) : (
              <div className="text-sm space-y-1">
                {emp.plan?.plan_carrera ? (
                  <p><span className="font-medium">Plan de carrera:</span> {emp.plan.plan_carrera}</p>
                ) : null}
                {emp.plan?.mentor ? (
                  <p><span className="font-medium">Mentor:</span> {emp.plan.mentor}</p>
                ) : null}
                {emp.plan?.proyectos_clave ? (
                  <p><span className="font-medium">Proyectos clave:</span> {emp.plan.proyectos_clave}</p>
                ) : null}
                {emp.plan?.notas ? (
                  <p><span className="font-medium">Notas:</span> {emp.plan.notas}</p>
                ) : null}
                {!emp.plan?.plan_carrera && !emp.plan?.mentor && !emp.plan?.proyectos_clave && !emp.plan?.notas && (
                  <p className="italic text-muted-foreground">Sin plan cargado</p>
                )}
              </div>
            )}
          </div>

          <AccionesSection
            tableroId={tableroId}
            empleadoId={emp.id}
            tipo="desarrollo"
            acciones={emp.acciones}
          />

          <NotasSection
            tableroId={tableroId}
            empleadoId={emp.id}
            tipo="desarrollo"
            notas={emp.notas}
            variant="desarrollo"
          />
        </div>
      )}
    </Card>
  );
};
