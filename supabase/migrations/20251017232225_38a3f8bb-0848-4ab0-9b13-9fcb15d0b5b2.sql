-- Fix security issues with evaluaciones and empresas tables

-- 1. Remove overly permissive empresa policies
DROP POLICY IF EXISTS "empresas_select_all" ON public.empresas;
DROP POLICY IF EXISTS "empresas_select_any_auth" ON public.empresas;

-- 2. Remove overly permissive evaluaciones policies that allow public access
DROP POLICY IF EXISTS "evaluaciones_select_all" ON public.evaluaciones;
DROP POLICY IF EXISTS "evaluaciones_select_any_auth" ON public.evaluaciones;

-- The existing role-based policies for empresas, equipos, tableros, and evaluaciones
-- already provide proper access control for managers, HRBP, and admins.
-- No additional policies needed as the existing ones are sufficient and secure.
