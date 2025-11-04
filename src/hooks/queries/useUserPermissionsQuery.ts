import { useQuery, QueryClient } from '@tanstack/react-query';
import { supabaseFetchUserPermissions, UserPermissions } from '@/services/permissions';

export const useUserPermissionsQuery = (userId?: string) => {
  return useQuery({
    queryKey: ['user_permissions', userId],
    queryFn: () => supabaseFetchUserPermissions(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
};

export const prefetchUserPermissions = async (queryClient: QueryClient, userId: string) => {
  await queryClient.prefetchQuery({
    queryKey: ['user_permissions', userId],
    queryFn: () => supabaseFetchUserPermissions(userId),
    staleTime: 5 * 60 * 1000,
  });
};
