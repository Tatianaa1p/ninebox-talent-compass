import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOverrides } from '@/contexts/OverrideContext';
import { QUADRANT_KEYS } from '@/types/override';

export interface EmpleadoConsolidado {
  id: string;
  nombre: string;
  performanceScore: number;
  potentialScore: number;
  cuadrante: string;
  tableroNombre: string;
  equipoNombre: string;
  tableroId: string;
  calibrado: boolean;
}

export interface TableroFuente {
  id: string;
  nombre: string;
  equipo_nombre: string;
}

export interface ConsolidatedNineBoxData {
  empleadosPorCuadrante: Record<string, EmpleadoConsolidado[]>;
  totalEmpleados: number;
  tablerosFuente: TableroFuente[];
}

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

const EMPTY_CUADRANTES = (): Record<string, EmpleadoConsolidado[]> => ({
  'Alto-Alto': [], 'Alto-Medio': [], 'Alto-Bajo': [],
  'Medio-Alto': [], 'Medio-Medio': [], 'Medio-Bajo': [],
  'Bajo-Alto': [], 'Bajo-Medio': [], 'Bajo-Bajo': [],
});

export const useConsolidatedNineBox = (
  empresaId: string | null,
  pais: string | null
) => {
  const { overrides } = useOverrides();

  const query = useQuery({
    queryKey: ['consolidated-ninebox', empresaId, pais],
    enabled: !!empresaId && !!pais,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<{
      tableros: Array<{ id: string; nombre: string; equipo_id: string | null; created_at: string }>;
      equipos: Record<string, string>;
      empleados: Array<{ id: string; nombre: string; performance: number | null; potencial: number | null; tablero_id: string | null }>;
    }> => {
      const { data: tableros, error: tErr } = await supabase
        .from('tableros')
        .select('id, nombre, equipo_id, created_at')
        .eq('empresa_id', empresaId!)
        .eq('pais', pais!)
        .order('created_at', { ascending: false });
      if (tErr) throw tErr;

      const tableroIds = (tableros || []).map((t) => t.id);
      if (tableroIds.length === 0) {
        return { tableros: [], equipos: {}, empleados: [] };
      }

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

      return {
        tableros: tableros || [],
        equipos: equiposMap,
        empleados: empleados || [],
      };
    },
  });

  const { data, isLoading } = query;

  const empleadosPorCuadrante = EMPTY_CUADRANTES();
  const tablerosFuente: TableroFuente[] = [];
  let totalEmpleados = 0;

  if (data && data.tableros.length > 0) {
    const tableroOrder: Record<string, number> = {};
    data.tableros.forEach((t, idx) => {
      tableroOrder[t.id] = idx;
    });

    const byName = new Map<string, (typeof data.empleados)[number]>();
    for (const emp of data.empleados) {
      if (!emp.tablero_id) continue;
      const existing = byName.get(emp.nombre);
      if (!existing) {
        byName.set(emp.nombre, emp);
      } else {
        const newOrder = tableroOrder[emp.tablero_id] ?? 999;
        const existingOrder = tableroOrder[existing.tablero_id!] ?? 999;
        if (newOrder < existingOrder) byName.set(emp.nombre, emp);
      }
    }

    const usedTableroIds = new Set<string>();

    for (const emp of byName.values()) {
      const tablero = data.tableros.find((t) => t.id === emp.tablero_id);
      if (!tablero) continue;

      const perfScore = Number(emp.performance ?? 0);
      const potScore = Number(emp.potencial ?? 0);

      let perfLevel = getPerformanceLevel(perfScore);
      let potLevel = getPotentialLevel(potScore);

      const ov = overrides.get(emp.nombre);
      let calibrado = false;
      if (ov) {
        const key = QUADRANT_KEYS[ov.override_cuadrante as keyof typeof QUADRANT_KEYS];
        if (key) {
          const [pot, perf] = key.split('-') as [
            'Alto' | 'Medio' | 'Bajo',
            'Alto' | 'Medio' | 'Bajo'
          ];
          potLevel = pot;
          perfLevel = perf;
          calibrado = true;
        } else if (ov.override_potencial_categoria && ov.override_desempeno_categoria) {
          potLevel = ov.override_potencial_categoria;
          perfLevel = ov.override_desempeno_categoria;
          calibrado = true;
        }
      }

      const cuadrante = `${potLevel}-${perfLevel}`;
      const equipoNombre = tablero.equipo_id
        ? data.equipos[tablero.equipo_id] || ''
        : '';

      if (empleadosPorCuadrante[cuadrante]) {
        empleadosPorCuadrante[cuadrante].push({
          id: emp.id,
          nombre: emp.nombre,
          performanceScore: perfScore,
          potentialScore: potScore,
          cuadrante,
          tableroNombre: tablero.nombre,
          equipoNombre,
          tableroId: tablero.id,
          calibrado,
        });
      }

      usedTableroIds.add(tablero.id);
      totalEmpleados += 1;
    }

    for (const t of data.tableros) {
      if (usedTableroIds.has(t.id)) {
        tablerosFuente.push({
          id: t.id,
          nombre: t.nombre,
          equipo_nombre: t.equipo_id ? data.equipos[t.equipo_id] || '' : '',
        });
      }
    }
  }

  return {
    empleadosPorCuadrante,
    totalEmpleados,
    tablerosFuente,
    loading: isLoading,
  };
};
