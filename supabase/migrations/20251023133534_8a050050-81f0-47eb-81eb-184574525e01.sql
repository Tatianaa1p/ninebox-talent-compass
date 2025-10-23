-- =====================================================
-- FIX: Clean up and simplify empresas RLS policies
-- =====================================================

-- Drop all existing conflicting policies on empresas
DROP POLICY IF EXISTS "Authenticated users can insert empresas" ON public.empresas;
DROP POLICY IF EXISTS "Authenticated users can view empresas" ON public.empresas;
DROP POLICY IF EXISTS "HRB APU - Empresas" ON public.empresas;
DROP POLICY IF EXISTS "HRBP can delete empresas" ON public.empresas;
DROP POLICY IF EXISTS "HRBP can insert empresas" ON public.empresas;
DROP POLICY IF EXISTS "HRBP can update empresas" ON public.empresas;
DROP POLICY IF EXISTS "Manager - Acceso Total Empresas" ON public.empresas;
DROP POLICY IF EXISTS "Manager - empresas Total" ON public.empresas;
DROP POLICY IF EXISTS "Managers can insert empresas" ON public.empresas;
DROP POLICY IF EXISTS "Managers can view empresas" ON public.empresas;
DROP POLICY IF EXISTS "empresas_access" ON public.empresas;
DROP POLICY IF EXISTS "empresas_select_hrbp" ON public.empresas;
DROP POLICY IF EXISTS "empresas_select_members" ON public.empresas;

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