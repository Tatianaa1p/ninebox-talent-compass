import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Obtiene los períodos (años) disponibles en `tableros`.
 * - Si se pasa empresaId, filtra por esa empresa.
 * - Devuelve los años únicos ordenados de mayor a menor.
 */
export const usePeriodosQuery = (empresaId?: string | null) => {
  return useQuery({
    queryKey: ['periodos', empresaId || 'all'],
    queryFn: async (): Promise<number[]> => {
      let query = supabase
        .from('tableros' as any)
        .select('periodo')
        .not('periodo', 'is', null);

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const periodos = Array.from(
        new Set(((data as any[]) || []).map((t) => t.periodo as number))
      ).sort((a, b) => b - a);

      return periodos;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
