import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Tablero {
  id: string;
  nombre: string;
  equipo_id: string;
  periodo?: number;
}

const fetchTableros = async (
  equipoId: string,
  periodo?: number
): Promise<Tablero[]> => {
  let query = supabase
    .from('tableros')
    .select('*')
    .eq('equipo_id', equipoId);

  if (periodo) {
    query = query.eq('periodo', periodo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading tableros:', error);
    throw error;
  }

  return data || [];
};

export const useTablerosQuery = (equipoId?: string, periodo?: number) => {
  return useQuery({
    queryKey: ['tableros', equipoId, periodo ?? 'all'],
    queryFn: () => fetchTableros(equipoId!, periodo),
    enabled: !!equipoId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
