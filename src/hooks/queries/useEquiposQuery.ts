import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Equipo {
  id: string;
  nombre: string;
  empresa_id: string;
}

const fetchEquipos = async (empresaId: string): Promise<Equipo[]> => {
  const { data, error } = await supabase
    .from('equipos')
    .select('*')
    .eq('empresa_id', empresaId);
  
  if (error) {
    console.error('Error loading equipos:', error);
    throw error;
  }
  
  return data || [];
};

export const useEquiposQuery = (empresaId?: string) => {
  return useQuery({
    queryKey: ['equipos', empresaId],
    queryFn: () => fetchEquipos(empresaId!),
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
