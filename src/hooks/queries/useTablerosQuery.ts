import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Tablero {
  id: string;
  nombre: string;
  equipo_id: string;
}

const fetchTableros = async (equipoId: string): Promise<Tablero[]> => {
  const { data, error } = await supabase
    .from('tableros')
    .select('*')
    .eq('equipo_id', equipoId);
  
  if (error) {
    console.error('Error loading tableros:', error);
    throw error;
  }
  
  return data || [];
};

export const useTablerosQuery = (equipoId?: string) => {
  return useQuery({
    queryKey: ['tableros', equipoId],
    queryFn: () => fetchTableros(equipoId!),
    enabled: !!equipoId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
