import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPermissions {
  role: string;
  empresas_acceso: string[];
  permisos_globales: {
    crear_tableros?: boolean;
    calibrar_tableros?: boolean;
    ver_equipos?: boolean;
  };
}

export const useUserPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching permissions:', error);
          setPermissions(null);
        } else if (data) {
          setPermissions({
            role: data.role,
            empresas_acceso: data.empresas_acceso,
            permisos_globales: data.permisos_globales as UserPermissions['permisos_globales'],
          });
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const hasAccess = (empresaNombre: string) => {
    if (!permissions) return false;
    return permissions.empresas_acceso.includes(empresaNombre);
  };

  const canCreateTableros = () => {
    return permissions?.permisos_globales?.crear_tableros === true;
  };

  const canCalibrateTableros = () => {
    return permissions?.permisos_globales?.calibrar_tableros === true;
  };

  const canViewEquipos = () => {
    return permissions?.permisos_globales?.ver_equipos === true;
  };

  return {
    permissions,
    loading,
    hasAccess,
    canCreateTableros,
    canCalibrateTableros,
    canViewEquipos,
  };
};
