import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GaussUserRole } from '@/types/gauss';

export const useGaussAccess = () => {
  const { user } = useAuth();

  const { data: gaussRole, isLoading } = useQuery({
    queryKey: ['gauss_access', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('gauss_user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching gauss access:', error);
        return null;
      }

      return data as GaussUserRole;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    hasAccess: !!gaussRole,
    role: gaussRole?.role,
    isLoading,
  };
};
