-- Empresas visibles donde soy miembro
CREATE POLICY "empresas_select_members"
ON public.empresas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.empresas_usuarios eu
    WHERE eu.empresa_id = empresas.id
      AND eu.user_id = auth.uid()
  )
);

-- Equipos visibles de mis empresas
CREATE POLICY "equipos_select_members"
ON public.equipos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.empresas_usuarios eu
    WHERE eu.empresa_id = equipos.empresa_id
      AND eu.user_id = auth.uid()
  )
);

-- Tableros visibles de mis empresas
CREATE POLICY "tableros_select_members"
ON public.tableros
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.empresas_usuarios eu
    WHERE eu.empresa_id = tableros.empresa_id
      AND eu.user_id = auth.uid()
  )
);

-- HRBP puede crear tableros en sus empresas
CREATE POLICY "tableros_insert_hrbp"
ON public.tableros
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.empresas_usuarios eu
    WHERE eu.empresa_id = tableros.empresa_id
      AND eu.user_id = auth.uid()
      AND eu.role = 'hrbp'
  )
);