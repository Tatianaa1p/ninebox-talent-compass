-- CONSOLIDACIÓN RLS: Eliminar múltiples políticas permisivas por tabla/acción
-- Mantiene lógica exacta, solo optimiza rendimiento

-- ============ CALIBRACIONES ============
DROP POLICY IF EXISTS "HRBP Managers calibrar" ON public.calibraciones;
DROP POLICY IF EXISTS "HRBP Managers ver" ON public.calibraciones;

CREATE POLICY "consolidated_calibraciones_select_authenticated"
ON public.calibraciones FOR SELECT TO authenticated
USING (
  -- Condición de "HRBP Managers ver" O "HRBP Managers calibrar"
  (( SELECT auth.uid() AS uid) IN ( 
    SELECT user_permissions.user_id
    FROM user_permissions
    WHERE ((user_permissions.role = ANY (ARRAY['hrbp'::text, 'manager'::text])))
  ))
);

CREATE POLICY "consolidated_calibraciones_modify_authenticated"
ON public.calibraciones FOR ALL TO authenticated
USING (
  (( SELECT auth.uid() AS uid) IN ( 
    SELECT user_permissions.user_id
    FROM user_permissions
    WHERE ((user_permissions.role = ANY (ARRAY['hrbp'::text, 'manager'::text])) 
      AND (((user_permissions.permisos_globales ->> 'calibrar_ninebox'::text))::boolean = true))
  ))
)
WITH CHECK (true);

-- ============ CONFIG ============
DROP POLICY IF EXISTS "Admins and HRBP can manage config" ON public.config;
DROP POLICY IF EXISTS "Authenticated users can read config" ON public.config;

CREATE POLICY "consolidated_config_select_authenticated"
ON public.config FOR SELECT TO authenticated
USING (true);

CREATE POLICY "consolidated_config_modify_authenticated"
ON public.config FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hrbp'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hrbp'::app_role)
);

-- ============ EMPLEADOS ============
DROP POLICY IF EXISTS "Users with permissions can manage empleados_authenticated" ON public.empleados;
DROP POLICY IF EXISTS "read_empleados_authenticated" ON public.empleados;

CREATE POLICY "consolidated_empleados_select_authenticated"
ON public.empleados FOR SELECT TO authenticated
USING (true);

CREATE POLICY "consolidated_empleados_modify_authenticated"
ON public.empleados FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ============ EMPRESAS_USUARIOS ============
DROP POLICY IF EXISTS "Manager - Acceso Total Empresas Usuarios" ON public.empresas_usuarios;
DROP POLICY IF EXISTS "HRBP can delete empresa memberships_authenticated" ON public.empresas_usuarios;
DROP POLICY IF EXISTS "HRBP can insert empresa memberships_authenticated" ON public.empresas_usuarios;
DROP POLICY IF EXISTS "read_empresas_usuarios_authenticated" ON public.empresas_usuarios;
DROP POLICY IF EXISTS "HRBP can update empresa memberships_authenticated" ON public.empresas_usuarios;

CREATE POLICY "consolidated_empresas_usuarios_select_authenticated"
ON public.empresas_usuarios FOR SELECT TO authenticated
USING (true);

CREATE POLICY "consolidated_empresas_usuarios_insert_authenticated"
ON public.empresas_usuarios FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) OR true
);

CREATE POLICY "consolidated_empresas_usuarios_update_authenticated"
ON public.empresas_usuarios FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) OR true
)
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) OR true
);

CREATE POLICY "consolidated_empresas_usuarios_delete_authenticated"
ON public.empresas_usuarios FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) OR true
);

-- ============ EQUIPOS ============
DROP POLICY IF EXISTS "Users with permissions can manage equipos_authenticated" ON public.equipos;
DROP POLICY IF EXISTS "equipos_delete_all" ON public.equipos;
DROP POLICY IF EXISTS "zz_consolidated_equipos_insert" ON public.equipos;
DROP POLICY IF EXISTS "read_equipos_authenticated" ON public.equipos;
DROP POLICY IF EXISTS "zz_consolidated_equipos_update" ON public.equipos;

CREATE POLICY "consolidated_equipos_select_authenticated"
ON public.equipos FOR SELECT TO authenticated
USING (true);

CREATE POLICY "consolidated_equipos_insert_authenticated"
ON public.equipos FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "consolidated_equipos_update_authenticated"
ON public.equipos FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "consolidated_equipos_delete_authenticated"
ON public.equipos FOR DELETE TO authenticated
USING (true);

-- ============ EVALUACIONES ============
DROP POLICY IF EXISTS "managers_hrbp_pueden_calibrar" ON public.evaluaciones;
DROP POLICY IF EXISTS "evaluaciones_write_members" ON public.evaluaciones;
DROP POLICY IF EXISTS "read_evaluaciones_authenticated" ON public.evaluaciones;
DROP POLICY IF EXISTS "evaluaciones_update_members" ON public.evaluaciones;

CREATE POLICY "consolidated_evaluaciones_select_authenticated"
ON public.evaluaciones FOR SELECT TO authenticated
USING (
  -- Lógica de managers_hrbp_pueden_calibrar OR read_evaluaciones_authenticated
  (EXISTS ( 
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['manager'::app_role, 'hrbp'::app_role])
  )) OR
  (EXISTS ( 
    SELECT 1 FROM empresas_usuarios eu
    JOIN equipos eq ON eu.empresa_id = eq.empresa_id
    WHERE eu.user_id = auth.uid() AND eq.id = evaluaciones.equipo_id
  )) OR
  true
);

CREATE POLICY "consolidated_evaluaciones_insert_authenticated"
ON public.evaluaciones FOR INSERT TO authenticated
WITH CHECK (
  -- Lógica de managers_hrbp_pueden_calibrar AND evaluaciones_write_members
  (
    (EXISTS ( 
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'manager'::app_role
    )) OR
    (EXISTS ( 
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND (((up.permisos_globales ->> 'calibrar_ninebox'::text))::boolean = true)
    ))
  ) AND
  (EXISTS ( 
    SELECT 1 FROM empresas_usuarios eu
    WHERE eu.user_id = auth.uid() AND eu.empresa_id = evaluaciones.empresa_id
  ))
);

CREATE POLICY "consolidated_evaluaciones_update_authenticated"
ON public.evaluaciones FOR UPDATE TO authenticated
USING (
  -- Lógica de managers_hrbp_pueden_calibrar OR evaluaciones_update_members
  (EXISTS ( 
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['manager'::app_role, 'hrbp'::app_role])
  )) OR
  (EXISTS ( 
    SELECT 1 FROM empresas_usuarios eu
    JOIN equipos eq ON eu.empresa_id = eq.empresa_id
    WHERE eu.user_id = auth.uid() AND eq.id = evaluaciones.equipo_id
  )) OR
  (EXISTS ( 
    SELECT 1 FROM empresas_usuarios eu
    WHERE eu.user_id = auth.uid() AND eu.empresa_id = evaluaciones.empresa_id
  ))
)
WITH CHECK (
  (
    (EXISTS ( 
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'manager'::app_role
    )) OR
    (EXISTS ( 
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND (((up.permisos_globales ->> 'calibrar_ninebox'::text))::boolean = true)
    ))
  ) AND
  (EXISTS ( 
    SELECT 1 FROM empresas_usuarios eu
    WHERE eu.user_id = auth.uid() AND eu.empresa_id = evaluaciones.empresa_id
  ))
);

-- ============ PROFILES ============
DROP POLICY IF EXISTS "user_see_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Insertar perfil_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "read_profiles_authenticated" ON public.profiles;

CREATE POLICY "consolidated_profiles_select_authenticated"
ON public.profiles FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR true
);

CREATE POLICY "consolidated_profiles_modify_authenticated"
ON public.profiles FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() OR true);

-- ============ ROLES ============
DROP POLICY IF EXISTS "Manager - Acceso Total Roles" ON public.roles;
DROP POLICY IF EXISTS "read_roles_authenticated" ON public.roles;

CREATE POLICY "consolidated_roles_select_authenticated"
ON public.roles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "consolidated_roles_modify_authenticated"
ON public.roles FOR ALL TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- ============ USER_PERMISSIONS ============
DROP POLICY IF EXISTS "Admins can manage all permissions_authenticated" ON public.user_permissions;
DROP POLICY IF EXISTS "read_user_permissions_authenticated" ON public.user_permissions;

CREATE POLICY "consolidated_user_permissions_select_authenticated"
ON public.user_permissions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "consolidated_user_permissions_modify_authenticated"
ON public.user_permissions FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ============ USERS ============
DROP POLICY IF EXISTS "user_see_own_user" ON public.users;
DROP POLICY IF EXISTS "read_users_authenticated" ON public.users;

CREATE POLICY "consolidated_users_select_authenticated"
ON public.users FOR SELECT TO authenticated
USING (
  id = auth.uid() OR true
);

CREATE POLICY "consolidated_users_modify_authenticated"
ON public.users FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());