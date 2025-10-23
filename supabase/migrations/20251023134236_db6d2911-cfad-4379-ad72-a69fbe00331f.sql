-- =====================================================
-- Permitir crear equipos y tableros sin restricciones
-- =====================================================

-- Limpiar políticas de equipos
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'equipos'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.equipos', pol.policyname);
    END LOOP;
END $$;

-- Políticas simples para equipos: todos pueden ver y crear
CREATE POLICY "equipos_select_all"
ON public.equipos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "equipos_insert_all"
ON public.equipos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "equipos_update_all"
ON public.equipos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "equipos_delete_all"
ON public.equipos
FOR DELETE
TO authenticated
USING (true);

-- Limpiar políticas de tableros
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'tableros'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.tableros', pol.policyname);
    END LOOP;
END $$;

-- Políticas simples para tableros: todos pueden ver y crear
CREATE POLICY "tableros_select_all"
ON public.tableros
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "tableros_insert_all"
ON public.tableros
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "tableros_update_all"
ON public.tableros
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "tableros_delete_all"
ON public.tableros
FOR DELETE
TO authenticated
USING (true);