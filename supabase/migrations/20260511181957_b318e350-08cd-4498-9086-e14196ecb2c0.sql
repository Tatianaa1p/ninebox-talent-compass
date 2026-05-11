
-- =========================================================
-- STEP 1: Helper functions based on user_permissions
-- =========================================================
CREATE OR REPLACE FUNCTION public.up_has_role(_user_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.up_has_empresa(_user_id uuid, _empresa_nombre text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND _empresa_nombre = ANY(empresas_acceso)
  );
$$;

CREATE OR REPLACE FUNCTION public.up_has_permission(_user_id uuid, _permiso text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND (permisos_globales ->> _permiso)::boolean = true
  );
$$;

CREATE OR REPLACE FUNCTION public.up_is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_permissions WHERE user_id = _user_id AND role = 'admin');
$$;

-- =========================================================
-- STEP 2: profiles
-- =========================================================
DROP POLICY IF EXISTS "consolidated_profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "consolidated_profiles_modify_authenticated" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.up_is_admin(auth.uid()));

CREATE POLICY "profiles_modify" ON public.profiles FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =========================================================
-- STEP 3: empresas
-- =========================================================
DROP POLICY IF EXISTS "Autenticados insertan empresas" ON public.empresas;
DROP POLICY IF EXISTS "zz_consolidated_empresas_update" ON public.empresas;
DROP POLICY IF EXISTS "read_empresas_authenticated" ON public.empresas;
DROP POLICY IF EXISTS "empresas_delete_hrbp" ON public.empresas;

CREATE POLICY "empresas_select" ON public.empresas FOR SELECT TO authenticated
USING (public.up_is_admin(auth.uid()) OR public.up_has_empresa(auth.uid(), nombre));

CREATE POLICY "empresas_insert" ON public.empresas FOR INSERT TO authenticated
WITH CHECK (public.up_is_admin(auth.uid()) OR public.up_has_role(auth.uid(), 'hrbp'));

CREATE POLICY "empresas_update" ON public.empresas FOR UPDATE TO authenticated
USING (public.up_is_admin(auth.uid()) OR public.up_has_role(auth.uid(), 'hrbp'))
WITH CHECK (public.up_is_admin(auth.uid()) OR public.up_has_role(auth.uid(), 'hrbp'));

CREATE POLICY "empresas_delete" ON public.empresas FOR DELETE TO authenticated
USING (public.up_is_admin(auth.uid()) OR public.up_has_role(auth.uid(), 'hrbp'));

-- =========================================================
-- STEP 4: equipos
-- =========================================================
DROP POLICY IF EXISTS "consolidated_equipos_select_authenticated" ON public.equipos;
DROP POLICY IF EXISTS "consolidated_equipos_insert_authenticated" ON public.equipos;
DROP POLICY IF EXISTS "consolidated_equipos_update_authenticated" ON public.equipos;
DROP POLICY IF EXISTS "consolidated_equipos_delete_authenticated" ON public.equipos;

CREATE POLICY "equipos_select" ON public.equipos FOR SELECT TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = equipos.empresa_id AND public.up_has_empresa(auth.uid(), e.nombre))
);

CREATE POLICY "equipos_modify" ON public.equipos FOR ALL TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR (public.up_has_role(auth.uid(), 'hrbp') AND EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = equipos.empresa_id AND public.up_has_empresa(auth.uid(), e.nombre)))
)
WITH CHECK (
  public.up_is_admin(auth.uid())
  OR (public.up_has_role(auth.uid(), 'hrbp') AND EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = equipos.empresa_id AND public.up_has_empresa(auth.uid(), e.nombre)))
);

-- =========================================================
-- STEP 5: empleados
-- =========================================================
DROP POLICY IF EXISTS "empleados_select" ON public.empleados;
DROP POLICY IF EXISTS "empleados_modify" ON public.empleados;

CREATE POLICY "empleados_select" ON public.empleados FOR SELECT TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.tableros t
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE t.id = empleados.tablero_id AND public.up_has_empresa(auth.uid(), e.nombre)
  )
);

CREATE POLICY "empleados_modify" ON public.empleados FOR ALL TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR (public.up_has_permission(auth.uid(), 'calibrar_tableros') AND EXISTS (
    SELECT 1 FROM public.tableros t
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE t.id = empleados.tablero_id AND public.up_has_empresa(auth.uid(), e.nombre)
  ))
)
WITH CHECK (
  public.up_is_admin(auth.uid())
  OR (public.up_has_permission(auth.uid(), 'calibrar_tableros') AND EXISTS (
    SELECT 1 FROM public.tableros t
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE t.id = empleados.tablero_id AND public.up_has_empresa(auth.uid(), e.nombre)
  ))
);

-- =========================================================
-- STEP 6: user_permissions
-- =========================================================
DROP POLICY IF EXISTS "user_permissions_select" ON public.user_permissions;
DROP POLICY IF EXISTS "user_permissions_modify" ON public.user_permissions;

CREATE POLICY "user_permissions_select" ON public.user_permissions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.up_is_admin(auth.uid()));

CREATE POLICY "user_permissions_modify" ON public.user_permissions FOR ALL TO authenticated
USING (public.up_is_admin(auth.uid())) WITH CHECK (public.up_is_admin(auth.uid()));

-- =========================================================
-- STEP 7: calibraciones
-- =========================================================
DROP POLICY IF EXISTS "calibraciones_modify" ON public.calibraciones;

CREATE POLICY "calibraciones_modify" ON public.calibraciones FOR ALL TO authenticated
USING (public.up_is_admin(auth.uid()) OR public.up_has_permission(auth.uid(), 'calibrar_ninebox'))
WITH CHECK (public.up_is_admin(auth.uid()) OR public.up_has_permission(auth.uid(), 'calibrar_ninebox'));

-- =========================================================
-- STEP 8: talent_plans
-- =========================================================
DROP POLICY IF EXISTS "talent_plans_select" ON public.talent_plans;
DROP POLICY IF EXISTS "talent_plans_modify" ON public.talent_plans;

CREATE POLICY "talent_plans_select" ON public.talent_plans FOR SELECT TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.tableros t
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE t.id = talent_plans.tablero_id AND public.up_has_empresa(auth.uid(), e.nombre)
  )
);

CREATE POLICY "talent_plans_modify" ON public.talent_plans FOR ALL TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR ((public.up_has_role(auth.uid(), 'hrbp') OR public.up_has_role(auth.uid(), 'manager')) AND EXISTS (
    SELECT 1 FROM public.tableros t
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE t.id = talent_plans.tablero_id AND public.up_has_empresa(auth.uid(), e.nombre)
  ))
)
WITH CHECK (
  public.up_is_admin(auth.uid())
  OR ((public.up_has_role(auth.uid(), 'hrbp') OR public.up_has_role(auth.uid(), 'manager')) AND EXISTS (
    SELECT 1 FROM public.tableros t
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE t.id = talent_plans.tablero_id AND public.up_has_empresa(auth.uid(), e.nombre)
  ))
);

-- =========================================================
-- STEP 9: talent_acciones
-- =========================================================
DROP POLICY IF EXISTS "talent_acciones_select" ON public.talent_acciones;
DROP POLICY IF EXISTS "talent_acciones_modify" ON public.talent_acciones;

CREATE POLICY "talent_acciones_select" ON public.talent_acciones FOR SELECT TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.talent_plans tp
    JOIN public.tableros t ON t.id = tp.tablero_id
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE tp.id = talent_acciones.plan_id AND public.up_has_empresa(auth.uid(), e.nombre)
  )
);

CREATE POLICY "talent_acciones_modify" ON public.talent_acciones FOR ALL TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR ((public.up_has_role(auth.uid(), 'hrbp') OR public.up_has_role(auth.uid(), 'manager')) AND EXISTS (
    SELECT 1 FROM public.talent_plans tp
    JOIN public.tableros t ON t.id = tp.tablero_id
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE tp.id = talent_acciones.plan_id AND public.up_has_empresa(auth.uid(), e.nombre)
  ))
)
WITH CHECK (
  public.up_is_admin(auth.uid())
  OR ((public.up_has_role(auth.uid(), 'hrbp') OR public.up_has_role(auth.uid(), 'manager')) AND EXISTS (
    SELECT 1 FROM public.talent_plans tp
    JOIN public.tableros t ON t.id = tp.tablero_id
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE tp.id = talent_acciones.plan_id AND public.up_has_empresa(auth.uid(), e.nombre)
  ))
);

-- =========================================================
-- STEP 10: talent_notas
-- =========================================================
DROP POLICY IF EXISTS "talent_notas_select" ON public.talent_notas;
DROP POLICY IF EXISTS "talent_notas_insert" ON public.talent_notas;

CREATE POLICY "talent_notas_select" ON public.talent_notas FOR SELECT TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.talent_plans tp
    JOIN public.tableros t ON t.id = tp.tablero_id
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE tp.id = talent_notas.plan_id AND public.up_has_empresa(auth.uid(), e.nombre)
  )
);

CREATE POLICY "talent_notas_insert" ON public.talent_notas FOR INSERT TO authenticated
WITH CHECK (
  public.up_is_admin(auth.uid())
  OR ((public.up_has_role(auth.uid(), 'hrbp') OR public.up_has_role(auth.uid(), 'manager')) AND EXISTS (
    SELECT 1 FROM public.talent_plans tp
    JOIN public.tableros t ON t.id = tp.tablero_id
    JOIN public.equipos eq ON eq.id = t.equipo_id
    JOIN public.empresas e ON e.id = eq.empresa_id
    WHERE tp.id = talent_notas.plan_id AND public.up_has_empresa(auth.uid(), e.nombre)
  ))
);
