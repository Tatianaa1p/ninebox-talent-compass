-- Crear tabla de membresías empresas-usuarios
CREATE TABLE IF NOT EXISTS public.empresas_usuarios (
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text CHECK (role IN ('hrbp','manager','admin')),
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (empresa_id, user_id)
);

-- Asegurar RLS activo en todas las tablas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tableros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas_usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para empresas_usuarios
CREATE POLICY "Users can view their own empresa memberships"
ON public.empresas_usuarios
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "HRBP can view all empresa memberships"
ON public.empresas_usuarios
FOR SELECT
USING (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can insert empresa memberships"
ON public.empresas_usuarios
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can update empresa memberships"
ON public.empresas_usuarios
FOR UPDATE
USING (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can delete empresa memberships"
ON public.empresas_usuarios
FOR DELETE
USING (has_role(auth.uid(), 'hrbp'::app_role));