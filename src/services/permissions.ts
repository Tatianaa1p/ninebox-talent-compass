import { supabase } from '@/integrations/supabase/client';

export interface UserPermissions {
  role: string;
  empresas_acceso: string[];
  permisos_globales: {
    crear_tableros?: boolean;
    calibrar_tableros?: boolean;
    ver_equipos?: boolean;
    calibrar_ninebox?: boolean;
    descargar_reportes?: boolean;
  };
}

export const supabaseFetchUserPermissions = async (userId: string): Promise<UserPermissions | null> => {
  try {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching permissions:', error);
      return null;
    }

    if (data) {
      return {
        role: data.role,
        empresas_acceso: data.empresas_acceso,
        permisos_globales: data.permisos_globales as UserPermissions['permisos_globales'],
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return null;
  }
};
