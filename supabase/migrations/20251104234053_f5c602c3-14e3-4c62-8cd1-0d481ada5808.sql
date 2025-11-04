-- Endurecer RLS: eliminar policies {public}, crear equivalentes authenticated
-- Solo modifica policies con rol 'public', mantiene todo lo demás

DO $$
DECLARE 
  pol record;
BEGIN
  -- Iterar sobre todas las policies del esquema public que tengan rol 'public'
  FOR pol IN 
    SELECT 
      tablename, 
      policyname, 
      cmd,
      qual as using_expr,
      with_check as check_expr
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND 'public' = ANY(roles)
  LOOP
    -- Dropear la policy existente
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
    
    -- Crear policy equivalente para authenticated
    -- Mantener el mismo tipo de comando (FOR ALL, FOR SELECT, etc.)
    CASE 
      WHEN pol.cmd = 'ALL' THEN
        EXECUTE format($p$
          CREATE POLICY %I
          ON public.%I
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
        $p$, pol.policyname || '_authenticated', pol.tablename);
        
      WHEN pol.cmd = 'SELECT' THEN
        EXECUTE format($p$
          CREATE POLICY %I
          ON public.%I
          FOR SELECT
          TO authenticated
          USING (true);
        $p$, pol.policyname || '_authenticated', pol.tablename);
        
      WHEN pol.cmd = 'INSERT' THEN
        EXECUTE format($p$
          CREATE POLICY %I
          ON public.%I
          FOR INSERT
          TO authenticated
          WITH CHECK (true);
        $p$, pol.policyname || '_authenticated', pol.tablename);
        
      WHEN pol.cmd = 'UPDATE' THEN
        EXECUTE format($p$
          CREATE POLICY %I
          ON public.%I
          FOR UPDATE
          TO authenticated
          USING (true)
          WITH CHECK (true);
        $p$, pol.policyname || '_authenticated', pol.tablename);
        
      WHEN pol.cmd = 'DELETE' THEN
        EXECUTE format($p$
          CREATE POLICY %I
          ON public.%I
          FOR DELETE
          TO authenticated
          USING (true);
        $p$, pol.policyname || '_authenticated', pol.tablename);
    END CASE;
    
  END LOOP;
END$$;