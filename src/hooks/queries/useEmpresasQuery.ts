import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Empresa {
  id: string;
  nombre: string;
}

const fetchEmpresas = async (): Promise<Empresa[]> => {
  const { data, error } = await supabase.from('empresas').select('*');
  
  if (error) {
    console.error('Error loading empresas:', error);
    throw error;
  }
  
  return data || [];
};

export const useEmpresasQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: fetchEmpresas,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
