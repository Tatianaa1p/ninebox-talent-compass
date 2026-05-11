import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  EmpleadoConPlan,
  TalentPlan,
  TalentAccion,
  TalentNota,
  TipoTalentPlan,
  AccionEstado,
  PipEstado,
  CuadrantePotencial,
} from '@/types/talentPlan';

const QUADRANT_NAMES: Record<string, CuadrantePotencial> = {
  'Alto-Alto': 'Talento Estratégico',
  'Alto-Medio': 'Desarrollar',
  'Medio-Alto': 'Consistente',
  'Alto-Bajo': 'Enigma',
  'Medio-Medio': 'Clave',
  'Bajo-Alto': 'Confiable',
  'Medio-Bajo': 'Dilema',
  'Bajo-Medio': 'Estancamiento',
  'Bajo-Bajo': 'Riesgo',
};

const MANAGED_QUADRANTS: CuadrantePotencial[] = [
  'Talento Estratégico',
  'Desarrollar',
  'Dilema',
  'Riesgo',
];

const getPerformanceLevel = (score: number): 'Bajo' | 'Medio' | 'Alto' => {
  if (score >= 4) return 'Alto';
  if (score >= 3) return 'Medio';
  return 'Bajo';
};
const getPotentialLevel = (score: number): 'Bajo' | 'Medio' | 'Alto' => {
  if (score > 2.5) return 'Alto';
  if (score > 1.5) return 'Medio';
  return 'Bajo';
};

const tipoForCuadrante = (c: CuadrantePotencial): TipoTalentPlan =>
  c === 'Dilema' || c === 'Riesgo' ? 'riesgo' : 'desarrollo';

export const useTalentPlans = (tableroId: string | null) => {
  return useQuery({
    queryKey: ['talent_plans', tableroId],
    enabled: !!tableroId,
    queryFn: async (): Promise<EmpleadoConPlan[]> => {
      if (!tableroId) return [];

      const { data: empleados, error: empErr } = await supabase
        .from('empleados' as any)
        .select('*')
        .eq('tablero_id', tableroId);
      if (empErr) throw empErr;

      const enriched = ((empleados as any[]) || [])
        .map((e) => {
          const perfLvl = getPerformanceLevel(Number(e.performance ?? 0));
          const potLvl = getPotentialLevel(Number(e.potencial ?? 0));
          const cuadrante = QUADRANT_NAMES[`${potLvl}-${perfLvl}`];
          return {
            id: e.id as string,
            nombre: e.nombre as string,
            performance: Number(e.performance ?? 0),
            potencial: Number(e.potencial ?? 0),
            tablero_id: e.tablero_id as string,
            cuadrante,
          };
        })
        .filter((e) => MANAGED_QUADRANTS.includes(e.cuadrante));

      if (enriched.length === 0) return [];

      const empleadoIds = enriched.map((e) => e.id);

      const { data: plans, error: planErr } = await supabase
        .from('talent_plans' as any)
        .select('*')
        .eq('tablero_id', tableroId)
        .in('empleado_id', empleadoIds);
      if (planErr) throw planErr;

      const plansList = (plans as unknown as TalentPlan[]) || [];
      const planIds = plansList.map((p) => p.id);

      const [accionesRes, notasRes] = await Promise.all([
        planIds.length
          ? supabase.from('talent_acciones' as any).select('*').in('plan_id', planIds)
          : Promise.resolve({ data: [], error: null }),
        planIds.length
          ? supabase.from('talent_notas' as any).select('*').in('plan_id', planIds).order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (accionesRes.error) throw accionesRes.error;
      if (notasRes.error) throw notasRes.error;

      const accionesAll = (accionesRes.data as unknown as TalentAccion[]) || [];
      const notasAll = (notasRes.data as unknown as TalentNota[]) || [];

      return enriched.map((e) => {
        const plan = plansList.find((p) => p.empleado_id === e.id) || null;
        const acciones = plan ? accionesAll.filter((a) => a.plan_id === plan.id) : [];
        const notas = plan ? notasAll.filter((n) => n.plan_id === plan.id) : [];
        return {
          ...e,
          tipo: tipoForCuadrante(e.cuadrante),
          plan,
          acciones,
          notas,
        };
      });
    },
  });
};

async function ensurePlan(
  empleadoId: string,
  tableroId: string,
  tipo: TipoTalentPlan,
): Promise<TalentPlan> {
  const { data: existing } = await supabase
    .from('talent_plans' as any)
    .select('*')
    .eq('empleado_id', empleadoId)
    .eq('tablero_id', tableroId)
    .maybeSingle();
  if (existing) return existing as unknown as TalentPlan;

  const { data: userRes } = await supabase.auth.getUser();
  const created_by = userRes.user?.id ?? null;

  const { data, error } = await supabase
    .from('talent_plans' as any)
    .insert({ empleado_id: empleadoId, tablero_id: tableroId, tipo, created_by })
    .select('*')
    .single();
  if (error) throw error;
  return data as unknown as TalentPlan;
}

export const useUpsertTalentPlan = (tableroId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      empleado_id: string;
      tipo: TipoTalentPlan;
      plan_carrera?: string | null;
      mentor?: string | null;
      proyectos_clave?: string | null;
      notas?: string | null;
      pip_objetivo?: string | null;
      pip_fecha_inicio?: string | null;
      pip_fecha_fin?: string | null;
      pip_estado?: PipEstado | null;
    }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const created_by = userRes.user?.id ?? null;
      const { data, error } = await supabase
        .from('talent_plans' as any)
        .upsert(
          { ...payload, tablero_id: tableroId, created_by },
          { onConflict: 'empleado_id,tablero_id' },
        )
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['talent_plans', tableroId] }),
  });
};

export const useAddAccion = (tableroId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      empleado_id: string;
      tipo: TipoTalentPlan;
      descripcion: string;
      fecha_limite?: string | null;
      responsable?: string | null;
    }) => {
      const plan = await ensurePlan(payload.empleado_id, tableroId, payload.tipo);
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from('talent_acciones' as any).insert({
        plan_id: plan.id,
        descripcion: payload.descripcion,
        fecha_limite: payload.fecha_limite ?? null,
        responsable: payload.responsable ?? null,
        created_by: userRes.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['talent_plans', tableroId] }),
  });
};

export const useUpdateAccionEstado = (tableroId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; estado: AccionEstado }) => {
      const { error } = await supabase
        .from('talent_acciones' as any)
        .update({ estado: payload.estado })
        .eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['talent_plans', tableroId] }),
  });
};

export const useDeleteAccion = (tableroId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('talent_acciones' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['talent_plans', tableroId] }),
  });
};

export const useAddNota = (tableroId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      empleado_id: string;
      tipo: TipoTalentPlan;
      contenido: string;
    }) => {
      const plan = await ensurePlan(payload.empleado_id, tableroId, payload.tipo);
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from('talent_notas' as any).insert({
        plan_id: plan.id,
        contenido: payload.contenido,
        autor_email: userRes.user?.email ?? null,
        created_by: userRes.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['talent_plans', tableroId] }),
  });
};
