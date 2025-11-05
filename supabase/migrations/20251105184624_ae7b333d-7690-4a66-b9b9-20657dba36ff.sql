-- ============================================
-- MÓDULO CURVA DE GAUSS (INDEPENDIENTE)
-- ============================================

-- Crear enum para roles de Gauss
CREATE TYPE public.gauss_role AS ENUM ('hrbp', 'hrbp_cl', 'manager', 'manager_cl');

-- Tabla de roles de usuarios autorizados para Curva de Gauss
CREATE TABLE public.gauss_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role gauss_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_gauss_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabla de calibraciones Gauss
CREATE TABLE public.calibracion_gauss (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_email TEXT NOT NULL,
  competencia TEXT NOT NULL,
  familia_cargo TEXT NOT NULL,
  score_original NUMERIC(3,2) NOT NULL CHECK (score_original >= 1.0 AND score_original <= 4.0),
  score_calibrado NUMERIC(3,2) NOT NULL CHECK (score_calibrado >= 1.0 AND score_calibrado <= 4.0),
  pais TEXT NOT NULL,
  equipo TEXT NOT NULL,
  seniority TEXT NOT NULL,
  posicion TEXT NOT NULL,
  fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
  ultima_calibracion_por TEXT,
  fecha_calibracion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.gauss_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibracion_gauss ENABLE ROW LEVEL SECURITY;

-- Función para verificar si un usuario tiene un rol específico de Gauss
CREATE OR REPLACE FUNCTION public.has_gauss_role(_user_id UUID, _role gauss_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gauss_user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Función para verificar si un usuario tiene cualquier rol de Gauss
CREATE OR REPLACE FUNCTION public.has_any_gauss_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gauss_user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS Policies para gauss_user_roles
CREATE POLICY "Users can view their own gauss role"
ON public.gauss_user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies para calibracion_gauss
CREATE POLICY "Gauss users can view calibrations"
ON public.calibracion_gauss
FOR SELECT
TO authenticated
USING (has_any_gauss_role(auth.uid()));

CREATE POLICY "Gauss users can insert calibrations"
ON public.calibracion_gauss
FOR INSERT
TO authenticated
WITH CHECK (has_any_gauss_role(auth.uid()));

CREATE POLICY "Gauss users can update calibrations"
ON public.calibracion_gauss
FOR UPDATE
TO authenticated
USING (has_any_gauss_role(auth.uid()))
WITH CHECK (has_any_gauss_role(auth.uid()));

CREATE POLICY "Gauss users can delete calibrations"
ON public.calibracion_gauss
FOR DELETE
TO authenticated
USING (has_any_gauss_role(auth.uid()));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_calibracion_gauss_updated_at
BEFORE UPDATE ON public.calibracion_gauss
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar usuarios autorizados con sus roles
INSERT INTO public.gauss_user_roles (user_id, email, role)
SELECT 
  au.id,
  au.email,
  CASE au.email
    WHEN 'agustinabelen.garcia@seidor.com' THEN 'hrbp'::gauss_role
    WHEN 'maria.curci@seidor.com' THEN 'hrbp'::gauss_role
    WHEN 'mary.mundarain@seidor.com' THEN 'hrbp'::gauss_role
    WHEN 'tatiana.pina@seidor.com' THEN 'manager'::gauss_role
    WHEN 'javiera.lopez@seidor.com' THEN 'hrbp_cl'::gauss_role
    WHEN 'francisca.gutierrez@seidor.com' THEN 'manager_cl'::gauss_role
  END as role
FROM auth.users au
WHERE au.email IN (
  'agustinabelen.garcia@seidor.com',
  'maria.curci@seidor.com',
  'mary.mundarain@seidor.com',
  'tatiana.pina@seidor.com',
  'javiera.lopez@seidor.com',
  'francisca.gutierrez@seidor.com'
)
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role, user_id = EXCLUDED.user_id;

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_calibracion_gauss_empleado ON public.calibracion_gauss(empleado_email);
CREATE INDEX idx_calibracion_gauss_competencia ON public.calibracion_gauss(competencia);
CREATE INDEX idx_calibracion_gauss_familia ON public.calibracion_gauss(familia_cargo);
CREATE INDEX idx_calibracion_gauss_pais ON public.calibracion_gauss(pais);
CREATE INDEX idx_gauss_user_roles_email ON public.gauss_user_roles(email);