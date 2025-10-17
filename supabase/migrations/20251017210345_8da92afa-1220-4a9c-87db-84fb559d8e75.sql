-- Create RLS policies for HRBP role

-- Empresas policies for HRBP
CREATE POLICY "HRBP can view all empresas" 
ON public.empresas 
FOR SELECT 
USING (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can insert empresas" 
ON public.empresas 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'hrbp'::app_role));

-- Equipos policies for HRBP
CREATE POLICY "HRBP can view all equipos" 
ON public.equipos 
FOR SELECT 
USING (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can insert equipos" 
ON public.equipos 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can update equipos" 
ON public.equipos 
FOR UPDATE 
USING (has_role(auth.uid(), 'hrbp'::app_role));

-- Tableros policies for HRBP
CREATE POLICY "HRBP can view all tableros" 
ON public.tableros 
FOR SELECT 
USING (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can insert tableros" 
ON public.tableros 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can update tableros" 
ON public.tableros 
FOR UPDATE 
USING (has_role(auth.uid(), 'hrbp'::app_role));

-- Evaluaciones policies for HRBP
CREATE POLICY "HRBP can view all evaluaciones" 
ON public.evaluaciones 
FOR SELECT 
USING (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can insert evaluaciones" 
ON public.evaluaciones 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can update evaluaciones" 
ON public.evaluaciones 
FOR UPDATE 
USING (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can delete evaluaciones" 
ON public.evaluaciones 
FOR DELETE 
USING (has_role(auth.uid(), 'hrbp'::app_role));