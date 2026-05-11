
-- 1. auth.users: revoke direct read access
REVOKE SELECT ON auth.users FROM authenticated;

-- 2. storage.objects
DROP POLICY IF EXISTS "anon_read_objects" ON storage.objects;
DROP POLICY IF EXISTS "public_read_objects" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_read_objects" ON storage.objects;

CREATE POLICY "storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  auth.uid()::text = (storage.foldername(name))[1]
  OR public.has_role(auth.uid(), 'admin')
);

-- 3. empleados
DROP POLICY IF EXISTS "consolidated_empleados_select_authenticated" ON public.empleados;
DROP POLICY IF EXISTS "consolidated_empleados_modify_authenticated" ON public.empleados;
DROP POLICY IF EXISTS "Modify empleados - solo autenticados" ON public.empleados;
DROP POLICY IF EXISTS "Select empleados - solo autenticados" ON public.empleados;

CREATE POLICY "empleados_select"
ON public.empleados FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.tableros t
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE t.id = empleados.tablero_id
      AND public.user_has_empresa_access(auth.uid(), e.nombre)
  )
);

CREATE POLICY "empleados_modify"
ON public.empleados FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    EXISTS (
      SELECT 1 FROM public.tableros t
      JOIN public.equipos eq ON eq.id = t.equipo_id
      JOIN public.empresas e ON e.id = eq.empresa_id
      WHERE t.id = empleados.tablero_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
    AND public.user_has_permission(auth.uid(), 'calibrar_tableros')
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    EXISTS (
      SELECT 1 FROM public.tableros t
      JOIN public.equipos eq ON eq.id = t.equipo_id
      JOIN public.empresas e ON e.id = eq.empresa_id
      WHERE t.id = empleados.tablero_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
    AND public.user_has_permission(auth.uid(), 'calibrar_tableros')
  )
);

-- 4. empresas_usuarios
DROP POLICY IF EXISTS "consolidated_empresas_usuarios_select_authenticated" ON public.empresas_usuarios;
DROP POLICY IF EXISTS "consolidated_empresas_usuarios_insert_authenticated" ON public.empresas_usuarios;
DROP POLICY IF EXISTS "consolidated_empresas_usuarios_update_authenticated" ON public.empresas_usuarios;
DROP POLICY IF EXISTS "consolidated_empresas_usuarios_delete_authenticated" ON public.empresas_usuarios;

CREATE POLICY "empresas_usuarios_select"
ON public.empresas_usuarios FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'hrbp')
);

CREATE POLICY "empresas_usuarios_modify"
ON public.empresas_usuarios FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. user_permissions
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "consolidated_user_permissions_modify_authenticated" ON public.user_permissions;
DROP POLICY IF EXISTS "consolidated_user_permissions_select_authenticated" ON public.user_permissions;

CREATE POLICY "user_permissions_select"
ON public.user_permissions FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "user_permissions_modify"
ON public.user_permissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. talent_plans
DROP POLICY IF EXISTS "talent_plans_select_authenticated" ON public.talent_plans;
DROP POLICY IF EXISTS "talent_plans_insert_authenticated" ON public.talent_plans;
DROP POLICY IF EXISTS "talent_plans_update_authenticated" ON public.talent_plans;
DROP POLICY IF EXISTS "talent_plans_delete_authenticated" ON public.talent_plans;
DROP POLICY IF EXISTS "talent_plans_select" ON public.talent_plans;
DROP POLICY IF EXISTS "talent_plans_insert" ON public.talent_plans;
DROP POLICY IF EXISTS "talent_plans_update" ON public.talent_plans;
DROP POLICY IF EXISTS "talent_plans_delete" ON public.talent_plans;

CREATE POLICY "talent_plans_select"
ON public.talent_plans FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.tableros t
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE t.id = talent_plans.tablero_id
      AND public.user_has_empresa_access(auth.uid(), e.nombre)
  )
);

CREATE POLICY "talent_plans_modify"
ON public.talent_plans FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    EXISTS (
      SELECT 1 FROM public.tableros t
      JOIN public.equipos eq ON eq.id = t.equipo_id
      JOIN public.empresas e ON e.id = eq.empresa_id
      WHERE t.id = talent_plans.tablero_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
    AND (public.has_role(auth.uid(), 'hrbp') OR public.has_role(auth.uid(), 'manager'))
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    EXISTS (
      SELECT 1 FROM public.tableros t
      JOIN public.equipos eq ON eq.id = t.equipo_id
      JOIN public.empresas e ON e.id = eq.empresa_id
      WHERE t.id = talent_plans.tablero_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
    AND (public.has_role(auth.uid(), 'hrbp') OR public.has_role(auth.uid(), 'manager'))
  )
);

-- talent_acciones
DROP POLICY IF EXISTS "talent_acciones_select_authenticated" ON public.talent_acciones;
DROP POLICY IF EXISTS "talent_acciones_insert_authenticated" ON public.talent_acciones;
DROP POLICY IF EXISTS "talent_acciones_update_authenticated" ON public.talent_acciones;
DROP POLICY IF EXISTS "talent_acciones_delete_authenticated" ON public.talent_acciones;
DROP POLICY IF EXISTS "talent_acciones_select" ON public.talent_acciones;
DROP POLICY IF EXISTS "talent_acciones_insert" ON public.talent_acciones;
DROP POLICY IF EXISTS "talent_acciones_update" ON public.talent_acciones;
DROP POLICY IF EXISTS "talent_acciones_delete" ON public.talent_acciones;

CREATE POLICY "talent_acciones_select"
ON public.talent_acciones FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.talent_plans tp
    JOIN public.tableros t ON t.id = tp.tablero_id
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE tp.id = talent_acciones.plan_id
      AND public.user_has_empresa_access(auth.uid(), e.nombre)
  )
);

CREATE POLICY "talent_acciones_modify"
ON public.talent_acciones FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    EXISTS (
      SELECT 1 FROM public.talent_plans tp
      JOIN public.tableros t ON t.id = tp.tablero_id
      JOIN public.equipos eq ON eq.id = t.equipo_id
      JOIN public.empresas e ON e.id = eq.empresa_id
      WHERE tp.id = talent_acciones.plan_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
    AND (public.has_role(auth.uid(), 'hrbp') OR public.has_role(auth.uid(), 'manager'))
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    EXISTS (
      SELECT 1 FROM public.talent_plans tp
      JOIN public.tableros t ON t.id = tp.tablero_id
      JOIN public.equipos eq ON eq.id = t.equipo_id
      JOIN public.empresas e ON e.id = eq.empresa_id
      WHERE tp.id = talent_acciones.plan_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
    AND (public.has_role(auth.uid(), 'hrbp') OR public.has_role(auth.uid(), 'manager'))
  )
);

-- talent_notas
DROP POLICY IF EXISTS "talent_notas_select_authenticated" ON public.talent_notas;
DROP POLICY IF EXISTS "talent_notas_insert_authenticated" ON public.talent_notas;
DROP POLICY IF EXISTS "talent_notas_update_authenticated" ON public.talent_notas;
DROP POLICY IF EXISTS "talent_notas_delete_authenticated" ON public.talent_notas;
DROP POLICY IF EXISTS "talent_notas_select" ON public.talent_notas;
DROP POLICY IF EXISTS "talent_notas_insert" ON public.talent_notas;

CREATE POLICY "talent_notas_select"
ON public.talent_notas FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.talent_plans tp
    JOIN public.tableros t ON t.id = tp.tablero_id
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE tp.id = talent_notas.plan_id
      AND public.user_has_empresa_access(auth.uid(), e.nombre)
  )
);

CREATE POLICY "talent_notas_insert"
ON public.talent_notas FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    EXISTS (
      SELECT 1 FROM public.talent_plans tp
      JOIN public.tableros t ON t.id = tp.tablero_id
      JOIN public.equipos eq ON eq.id = t.equipo_id
      JOIN public.empresas e ON e.id = eq.empresa_id
      WHERE tp.id = talent_notas.plan_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
    AND (public.has_role(auth.uid(), 'hrbp') OR public.has_role(auth.uid(), 'manager'))
  )
);

-- 7. calibraciones
DROP POLICY IF EXISTS "consolidated_calibraciones_modify_authenticated" ON public.calibraciones;

CREATE POLICY "calibraciones_modify"
ON public.calibraciones FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid()
      AND role = ANY(ARRAY['hrbp', 'manager'])
      AND (permisos_globales->>'calibrar_ninebox')::boolean = true
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid()
      AND role = ANY(ARRAY['hrbp', 'manager'])
      AND (permisos_globales->>'calibrar_ninebox')::boolean = true
  )
);
