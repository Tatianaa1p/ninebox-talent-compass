import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmpleadoGauss {
  id: string;
  nombre: string;
  performance: number;
  potencial: number;
  cuadrante: string;
  equipoNombre: string;
  tableroNombre: string;
  empresaNombre: string;
  tableroId: string;
}

const QUADRANT_NAMES: Record<string, string> = {
  'Alto-Alto': 'Talento Estratégico',
  'Alto-Medio': 'Desarrollar',
  'Alto-Bajo': 'Enigma',
  'Medio-Alto': 'Consistente',
  'Medio-Medio': 'Clave',
  'Medio-Bajo': 'Dilema',
  'Bajo-Alto': 'Confiable',
  'Bajo-Medio': 'Estancamiento',
  'Bajo-Bajo': 'Riesgo',
};

const getPotentialLevel = (s: number) => (s > 2.5 ? 'Alto' : s > 1.5 ? 'Medio' : 'Bajo');
const getPerformanceLevel = (s: number) => (s >= 4 ? 'Alto' : s >= 3 ? 'Medio' : 'Bajo');

export const useGaussData = (empresaId: string | null, periodo?: number) => {
  return useQuery({
    queryKey: ['gauss_data', empresaId, periodo ?? 'all'],
    enabled: !!empresaId,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<EmpleadoGauss[]> => {
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id, nombre')
        .eq('id', empresaId!)
        .maybeSingle();
      const empresaNombre = empresa?.nombre || '';

      let tablerosQuery = supabase
        .from('tableros')
        .select('id, nombre, equipo_id, created_at')
        .eq('empresa_id', empresaId!)
        .order('created_at', { ascending: false });
      if (periodo) tablerosQuery = tablerosQuery.eq('periodo', periodo);
      const { data: tableros, error: tErr } = await tablerosQuery;
      if (tErr) throw tErr;

      const tableroIds = (tableros || []).map((t) => t.id);
      if (tableroIds.length === 0) return [];

      const equipoIds = Array.from(
        new Set((tableros || []).map((t) => t.equipo_id).filter(Boolean) as string[])
      );
      let equiposMap: Record<string, string> = {};
      if (equipoIds.length > 0) {
        const { data: equipos } = await supabase
          .from('equipos')
          .select('id, nombre')
          .in('id', equipoIds);
        equiposMap = Object.fromEntries((equipos || []).map((e) => [e.id, e.nombre]));
      }

      const { data: empleados, error: eErr } = await supabase
        .from('empleados')
        .select('id, nombre, performance, potencial, tablero_id')
        .in('tablero_id', tableroIds);
      if (eErr) throw eErr;

      const tableroOrder: Record<string, number> = {};
      (tableros || []).forEach((t, i) => (tableroOrder[t.id] = i));

      const byName = new Map<string, (typeof empleados)[number]>();
      for (const emp of empleados || []) {
        if (!emp.tablero_id) continue;
        const key = (emp.nombre || '').toLowerCase().trim();
        const existing = byName.get(key);
        if (!existing) {
          byName.set(key, emp);
        } else {
          const newOrder = tableroOrder[emp.tablero_id] ?? 999;
          const existingOrder = tableroOrder[existing.tablero_id!] ?? 999;
          if (newOrder < existingOrder) byName.set(key, emp);
        }
      }

      const result: EmpleadoGauss[] = [];
      for (const emp of byName.values()) {
        const tablero = (tableros || []).find((t) => t.id === emp.tablero_id);
        if (!tablero) continue;
        const perf = Number(emp.performance ?? 0);
        const pot = Number(emp.potencial ?? 0);
        const cuadrante =
          QUADRANT_NAMES[`${getPotentialLevel(pot)}-${getPerformanceLevel(perf)}`] || 'Sin datos';
        result.push({
          id: emp.id,
          nombre: emp.nombre,
          performance: perf,
          potencial: pot,
          cuadrante,
          equipoNombre: tablero.equipo_id ? equiposMap[tablero.equipo_id] || '' : '',
          tableroNombre: tablero.nombre,
          empresaNombre,
          tableroId: tablero.id,
        });
      }
      return result;
    },
  });
};
