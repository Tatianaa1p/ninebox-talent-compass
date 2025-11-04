-- Endurecer RLS mínimo: solo lectura a autenticados
-- Para tableros, empleados, evaluaciones, calibraciones

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT unnest(ARRAY['tableros','empleados','evaluaciones','calibraciones']) AS t LOOP
    -- Asegurar que RLS está habilitado
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.t);
    
    -- Borrar policy anon_read_* si existe (solo SELECT)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=r.t AND policyname='anon_read_'||r.t) THEN
      EXECUTE format('DROP POLICY anon_read_%I ON public.%I;', r.t, r.t);
    END IF;
    
    -- Crear lectura para autenticados si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=r.t AND policyname='read_'||r.t||'_authenticated') THEN
      EXECUTE format($p$
        CREATE POLICY read_%1$I_authenticated
        ON public.%1$I
        FOR SELECT
        TO authenticated
        USING (true);
      $p$, r.t);
    END IF;
  END LOOP;
END$$;

-- Endurecer funciones con search_path explícito (previene hijacking)
ALTER FUNCTION public.crear_calibracion_por_defecto() SET search_path = public, extensions;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, extensions;

-- NOTA: Activar manualmente en Supabase Dashboard → Authentication → Auth Providers → Email
-- "Leaked Password Protection" para prevenir contraseñas comprometidas (no afecta OAuth)