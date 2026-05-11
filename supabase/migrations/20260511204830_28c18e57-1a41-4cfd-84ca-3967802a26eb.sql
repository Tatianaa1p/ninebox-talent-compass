-- 1. roles table lockdown
DROP POLICY IF EXISTS "consolidated_roles_modify_authenticated" ON public.roles;
DROP POLICY IF EXISTS "roles_modify" ON public.roles;
DROP POLICY IF EXISTS "consolidated_roles_select_authenticated" ON public.roles;
DROP POLICY IF EXISTS "roles_select" ON public.roles;

CREATE POLICY "roles_modify"
ON public.roles FOR ALL TO authenticated
USING (public.up_is_admin(auth.uid()))
WITH CHECK (public.up_is_admin(auth.uid()));

CREATE POLICY "roles_select"
ON public.roles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.up_is_admin(auth.uid())
);

-- 2. Storage: scoped por empresa (path = <empresa>/<tablero>/<file>)
DROP POLICY IF EXISTS "storage_select" ON storage.objects;
DROP POLICY IF EXISTS "HRBP y Managers pueden ver reportes" ON storage.objects;
DROP POLICY IF EXISTS "hrbp_managers_can_view_reports" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_read_objects" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_scoped" ON storage.objects;

CREATE POLICY "storage_select_scoped"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'reportes'
  AND (
    public.up_is_admin(auth.uid())
    OR public.up_has_empresa(auth.uid(), replace((storage.foldername(name))[1], '_', ' '))
    OR public.up_has_empresa(auth.uid(), (storage.foldername(name))[1])
  )
);

-- 3. Realtime: sacar tablas globales (empleados se queda, ya tiene filtro)
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.empresas; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.equipos; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.calibraciones; EXCEPTION WHEN undefined_object THEN NULL; END;
END $$;

-- 4. usuarios_empresas: cerrar SELECT abierto
DROP POLICY IF EXISTS "read_usuarios_empresas_authenticated" ON public.usuarios_empresas;
DROP POLICY IF EXISTS "usuarios_empresas_select" ON public.usuarios_empresas;

CREATE POLICY "usuarios_empresas_select"
ON public.usuarios_empresas FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.up_is_admin(auth.uid())
);

-- 5. REVOKE EXECUTE de funciones SECURITY DEFINER para anon
REVOKE EXECUTE ON FUNCTION public.up_is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.up_has_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.up_has_empresa(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.up_has_permission(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_empresa_access(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_permission(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_hrb_apu(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_hrb_apu_any(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_gauss_role(uuid, gauss_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_any_gauss_role(uuid) FROM anon;