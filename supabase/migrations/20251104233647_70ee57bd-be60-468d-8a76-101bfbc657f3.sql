-- Endurecer RLS de lectura: eliminar anon, solo authenticated
-- No tocar policies de escritura (INSERT/UPDATE/DELETE)

DO $$
DECLARE 
  tabla_nombre TEXT;
  pol record;
  tablas TEXT[] := ARRAY[
    'calibraciones', 'config', 'empleados', 'empresas', 'empresas_usuarios',
    'equipos', 'evaluaciones', 'profiles', 'roles', 'tableros',
    'user_permissions', 'user_roles', 'users', 'usuarios_empresas'
  ];
BEGIN
  FOREACH tabla_nombre IN ARRAY tablas LOOP
    -- Asegurar RLS habilitado
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tabla_nombre);
    
    -- Eliminar policies SELECT que permitan anon/public
    FOR pol IN 
      SELECT policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = tabla_nombre
        AND cmd = 'SELECT'
        AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, tabla_nombre);
    END LOOP;
    
    -- Crear policy de lectura autenticados si no existe
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' 
        AND tablename=tabla_nombre
        AND policyname='read_'||tabla_nombre||'_authenticated'
    ) THEN
      EXECUTE format($p$
        CREATE POLICY read_%1$I_authenticated
        ON public.%1$I
        FOR SELECT
        TO authenticated
        USING (true);
      $p$, tabla_nombre);
    END IF;
  END LOOP;
END$$;

-- Endurecer storage.objects: solo lectura autenticados
DROP POLICY IF EXISTS "anon_read_objects" ON storage.objects;
DROP POLICY IF EXISTS "public_read_objects" ON storage.objects;

-- Asegurar lectura autenticados en storage.objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' 
      AND tablename='objects' 
      AND policyname='authenticated_read_objects'
  ) THEN
    CREATE POLICY authenticated_read_objects
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END$$;