-- Enable anonymous access for demo mode
-- Add policies for anonymous users (when auth.uid() IS NULL)

-- Empresas: Allow anonymous SELECT
CREATE POLICY "Anonymous users can view empresas (demo mode)"
ON public.empresas
FOR SELECT
USING (true);

-- Equipos: Allow anonymous SELECT
CREATE POLICY "Anonymous users can view equipos (demo mode)"
ON public.equipos
FOR SELECT
USING (true);

-- Tableros: Allow anonymous SELECT
CREATE POLICY "Anonymous users can view tableros (demo mode)"
ON public.tableros
FOR SELECT
USING (true);

-- Tableros: Allow anonymous INSERT (for demo mode)
CREATE POLICY "Anonymous users can create tableros (demo mode)"
ON public.tableros
FOR INSERT
WITH CHECK (true);

-- Evaluaciones: Allow anonymous SELECT
CREATE POLICY "Anonymous users can view evaluaciones (demo mode)"
ON public.evaluaciones
FOR SELECT
USING (true);

-- Evaluaciones: Allow anonymous INSERT
CREATE POLICY "Anonymous users can create evaluaciones (demo mode)"
ON public.evaluaciones
FOR INSERT
WITH CHECK (true);

-- Evaluaciones: Allow anonymous UPDATE
CREATE POLICY "Anonymous users can update evaluaciones (demo mode)"
ON public.evaluaciones
FOR UPDATE
USING (true);

-- Evaluaciones: Allow anonymous DELETE
CREATE POLICY "Anonymous users can delete evaluaciones (demo mode)"
ON public.evaluaciones
FOR DELETE
USING (true);