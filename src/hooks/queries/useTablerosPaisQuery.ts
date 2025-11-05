import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Tablero {
  id: string;
  nombre: string;
  pais: string | null;
  created_at: string | null;
}

const fetchTablerosPorPais = async (pais?: string): Promise<Tablero[]> => {
  let query = supabase
    .from('tableros')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (pais && pais !== 'all') {
    query = query.eq('pais', pais);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error loading tableros:', error);
    throw error;
  }
  
  return data || [];
};

export const useTablerosPaisQuery = (pais?: string) => {
  return useQuery({
    queryKey: ['tableros-pais', pais],
    queryFn: () => fetchTablerosPorPais(pais),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
