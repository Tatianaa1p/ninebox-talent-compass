-- =====================================================
-- FIX: Clean up and simplify empresas RLS policies (v2)
-- =====================================================

-- Drop ALL existing policies on empresas (including any we might have missed)
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'empresas'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.empresas', pol.policyname);
    END LOOP;
END $$;

-- Create clean, simple policies using user_roles table
-- All authenticated users can view empresas
CREATE POLICY "empresas_select_all"
ON public.empresas
FOR SELECT
TO authenticated
USING (true);

-- All authenticated users can insert empresas (managers can create their own)
CREATE POLICY "empresas_insert_authenticated"
ON public.empresas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- HRBP can update and delete empresas
CREATE POLICY "empresas_update_hrbp"
ON public.empresas
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'hrbp'::app_role))
WITH CHECK (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "empresas_delete_hrbp"
ON public.empresas
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'hrbp'::app_role));