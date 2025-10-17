-- Add RLS policies for empresas and tableros to support authenticated users

-- 1. Add policy to allow all authenticated users to view empresas
CREATE POLICY "Authenticated users can view empresas"
ON public.empresas
FOR SELECT
TO authenticated
USING (true);

-- 2. Add policy to allow authenticated users to insert empresas
CREATE POLICY "Authenticated users can insert empresas"
ON public.empresas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Add policy to allow authenticated users to insert tableros for their own equipos
CREATE POLICY "Authenticated users can insert tableros for their teams"
ON public.tableros
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM equipos
    WHERE equipos.id = tableros.equipo_id
    AND equipos.manager_id = auth.uid()
  )
);

-- 4. Add policy to allow authenticated users to insert equipos
CREATE POLICY "Authenticated users can insert equipos"
ON public.equipos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = manager_id);