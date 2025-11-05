import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GaussUserRole } from '@/types/gauss';

export const useGaussAccess = () => {
  const { user } = useAuth();

  const { data: gaussRole, isLoading } = useQuery({
    queryKey: ['gauss_access', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[useGaussAccess] No user ID found');
        return null;
      }

      console.log('[useGaussAccess] Fetching gauss role for user:', user.id);

      const { data, error } = await supabase
        .from('gauss_user_roles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useGaussAccess] Error fetching gauss access:', error);
        return null;
      }

      console.log('[useGaussAccess] Gauss role data:', data);
      return data as GaussUserRole | null;
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
