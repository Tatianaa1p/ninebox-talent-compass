import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissionsQuery } from '@/hooks/queries/useUserPermissionsQuery';

export type { UserPermissions } from '@/services/permissions';

export const useUserPermissions = () => {
  const { user } = useAuth();
  
  // Use cached query
  const { data: permissions, isLoading, isFetching } = useUserPermissionsQuery(user?.id);
  
  // Combine loading states
  const loading = isLoading || isFetching;

  const hasAccess = useCallback((empresaNombre: string) => {
    if (!permissions) return false;
    return permissions.empresas_acceso.includes(empresaNombre);
  }, [permissions]);

  const canCreateTableros = useCallback(() => {
    return permissions?.permisos_globales?.crear_tableros === true;
  }, [permissions?.permisos_globales?.crear_tableros]);

  const canCalibrateTableros = useCallback(() => {
    return permissions?.permisos_globales?.calibrar_tableros === true;
  }, [permissions?.permisos_globales?.calibrar_tableros]);

  const canViewEquipos = useCallback(() => {
    return permissions?.permisos_globales?.ver_equipos === true;
  }, [permissions?.permisos_globales?.ver_equipos]);

  const canCalibrateNinebox = useCallback(() => {
    return permissions?.permisos_globales?.calibrar_ninebox === true;
  }, [permissions?.permisos_globales?.calibrar_ninebox]);

  const canDownloadReports = useCallback(() => {
    return permissions?.permisos_globales?.descargar_reportes === true;
  }, [permissions?.permisos_globales?.descargar_reportes]);

  return {
    permissions,
    loading,
    hasAccess,
    canCreateTableros,
    canCalibrateTableros,
    canViewEquipos,
    canCalibrateNinebox,
    canDownloadReports,
  };
};
