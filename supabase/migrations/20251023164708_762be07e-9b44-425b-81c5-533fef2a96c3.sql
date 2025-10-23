-- Fix Critical Security Issues: Enable RLS and Restrict Access

-- 1. Enable RLS on empresas table
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- 2. Fix tableros policies - restrict access by company membership
-- Drop overly permissive policies
DROP POLICY IF EXISTS "tableros_select_all" ON public.tableros;
DROP POLICY IF EXISTS "tableros_insert_all" ON public.tableros;
DROP POLICY IF EXISTS "tableros_update_all" ON public.tableros;
DROP POLICY IF EXISTS "tableros_delete_all" ON public.tableros;

-- Users can view boards in their companies
CREATE POLICY "Users can view tableros in their companies"
ON public.tableros
FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM empresas_usuarios WHERE user_id = auth.uid()
  )
);

-- HRBP can manage all boards in their companies
CREATE POLICY "HRBP can manage tableros"
ON public.tableros
FOR ALL
USING (
  empresa_id IN (
    SELECT empresa_id FROM empresas_usuarios 
    WHERE user_id = auth.uid() AND role = 'hrbp'
  )
)
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM empresas_usuarios 
    WHERE user_id = auth.uid() AND role = 'hrbp'
  )
);

-- Managers can manage boards in their teams
CREATE POLICY "Managers can manage team tableros"
ON public.tableros
FOR ALL
USING (
  equipo_id IN (
    SELECT id FROM equipos WHERE manager_id = auth.uid()
  )
)
WITH CHECK (
  equipo_id IN (
    SELECT id FROM equipos WHERE manager_id = auth.uid()
  )
);