-- Add missing RLS policies for HRBP to have full access (ALL operations)

-- Empresas: add UPDATE and DELETE policies
CREATE POLICY "HRBP can update empresas" 
ON public.empresas 
FOR UPDATE 
USING (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can delete empresas" 
ON public.empresas 
FOR DELETE 
USING (has_role(auth.uid(), 'hrbp'::app_role));

-- Equipos: add DELETE policy
CREATE POLICY "HRBP can delete equipos" 
ON public.equipos 
FOR DELETE 
USING (has_role(auth.uid(), 'hrbp'::app_role));

-- Tableros: add DELETE policy
CREATE POLICY "HRBP can delete tableros" 
ON public.tableros 
FOR DELETE 
USING (has_role(auth.uid(), 'hrbp'::app_role));