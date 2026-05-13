import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Tablero {
  id: string;
  nombre: string;
  pais: string | null;
  created_at: string | null;
  es_espejo?: boolean;
}

const fetchTablerosPorPais = async (pais?: string): Promise<Tablero[]> => {
  let query = supabase
    .from('tableros')
    .select('*')
    .eq('modulo_origen', 'gauss') // Only fetch Gauss module tableros
    .order('created_at', { ascending: false });
  
  if (pais && pais !== 'all') {
    query = query.ilike('pais', pais);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error loading tableros:', error);
    throw error;
  }

  // Marcar tableros que tienen un origen Ninebox (espejo automático)
  const ids = (data || []).map((t: any) => t.id);
  let espejoSet = new Set<string>();
  if (ids.length > 0) {
    const { data: espejos } = await supabase
      .from('tablero_espejo' as any)
      .select('tablero_gauss_id')
      .in('tablero_gauss_id', ids);
    espejoSet = new Set(((espejos as any[]) || []).map(e => e.tablero_gauss_id));
  }

  const result = (data || []).map((t: any) => ({ ...t, es_espejo: espejoSet.has(t.id) }));
  console.log('[useTablerosPaisQuery] Tableros fetched:', result.length, 'for pais:', pais);
  return result;
};

export const useTablerosPaisQuery = (pais?: string) => {
  return useQuery({
    queryKey: ['tableros-pais', pais],
    queryFn: () => fetchTablerosPorPais(pais),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
