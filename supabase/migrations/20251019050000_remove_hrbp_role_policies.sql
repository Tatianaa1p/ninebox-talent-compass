-- Remove HRBP-specific role checks from RLS policies so any authenticated user can access data

-- Empresas policies
DROP POLICY IF EXISTS "HRBP can view all empresas" ON public.empresas;
DROP POLICY IF EXISTS "HRBP can insert empresas" ON public.empresas;
DROP POLICY IF EXISTS "HRBP can update empresas" ON public.empresas;
DROP POLICY IF EXISTS "HRBP can delete empresas" ON public.empresas;

CREATE POLICY "Authenticated users can view empresas"
ON public.empresas
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert empresas"
ON public.empresas
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update empresas"
ON public.empresas
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete empresas"
ON public.empresas
FOR DELETE
USING (auth.role() = 'authenticated');

-- Equipos policies
DROP POLICY IF EXISTS "HRBP can view all equipos" ON public.equipos;
DROP POLICY IF EXISTS "HRBP can insert equipos" ON public.equipos;
DROP POLICY IF EXISTS "HRBP can update equipos" ON public.equipos;
DROP POLICY IF EXISTS "HRBP can delete equipos" ON public.equipos;

CREATE POLICY "Authenticated users can view equipos"
ON public.equipos
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert equipos"
ON public.equipos
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update equipos"
ON public.equipos
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete equipos"
ON public.equipos
FOR DELETE
USING (auth.role() = 'authenticated');

-- Tableros policies
DROP POLICY IF EXISTS "HRBP can view all tableros" ON public.tableros;
DROP POLICY IF EXISTS "HRBP can insert tableros" ON public.tableros;
DROP POLICY IF EXISTS "HRBP can update tableros" ON public.tableros;
DROP POLICY IF EXISTS "HRBP can delete tableros" ON public.tableros;

CREATE POLICY "Authenticated users can view tableros"
ON public.tableros
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tableros"
ON public.tableros
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tableros"
ON public.tableros
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tableros"
ON public.tableros
FOR DELETE
USING (auth.role() = 'authenticated');

-- Evaluaciones policies
DROP POLICY IF EXISTS "HRBP can view all evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "HRBP can insert evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "HRBP can update evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "HRBP can delete evaluaciones" ON public.evaluaciones;

CREATE POLICY "Authenticated users can view evaluaciones"
ON public.evaluaciones
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert evaluaciones"
ON public.evaluaciones
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update evaluaciones"
ON public.evaluaciones
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete evaluaciones"
ON public.evaluaciones
FOR DELETE
USING (auth.role() = 'authenticated');

-- Empresas_usuarios policies
DROP POLICY IF EXISTS "Users can view their own empresa memberships" ON public.empresas_usuarios;
DROP POLICY IF EXISTS "HRBP can view all empresa memberships" ON public.empresas_usuarios;
DROP POLICY IF EXISTS "HRBP can insert empresa memberships" ON public.empresas_usuarios;
DROP POLICY IF EXISTS "HRBP can update empresa memberships" ON public.empresas_usuarios;
DROP POLICY IF EXISTS "HRBP can delete empresa memberships" ON public.empresas_usuarios;

CREATE POLICY "Authenticated users can view empresa memberships"
ON public.empresas_usuarios
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert empresa memberships"
ON public.empresas_usuarios
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update empresa memberships"
ON public.empresas_usuarios
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete empresa memberships"
ON public.empresas_usuarios
FOR DELETE
USING (auth.role() = 'authenticated');
