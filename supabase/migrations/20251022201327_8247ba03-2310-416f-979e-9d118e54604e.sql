-- 1. Crear tabla roles con RLS si no existe
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role = 'HRB APU'),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, empresa_id, role)
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 2. Añadir constraint único a empresas.nombre si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'empresas_nombre_key'
  ) THEN
    ALTER TABLE public.empresas ADD CONSTRAINT empresas_nombre_key UNIQUE (nombre);
  END IF;
END $$;

-- 3. Crear empresas Uruguay y Paraguay si no existen
INSERT INTO public.empresas (nombre) 
VALUES ('Uruguay'), ('Paraguay'), ('Argentina')
ON CONFLICT (nombre) DO NOTHING;

-- 4. Agregar empresa_id a calibraciones si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'calibraciones' 
    AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE public.calibraciones ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
  END IF;
END $$;

-- 5. Crear funciones para verificar rol HRB APU
CREATE OR REPLACE FUNCTION public.is_hrb_apu(_user_id UUID, _empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.roles
    WHERE user_id = _user_id
      AND role = 'HRB APU'
      AND empresa_id = _empresa_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_hrb_apu_any(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.roles r
    INNER JOIN public.empresas e ON r.empresa_id = e.id
    WHERE r.user_id = _user_id
      AND r.role = 'HRB APU'
      AND e.nombre IN ('Argentina', 'Uruguay', 'Paraguay')
  )
$$;

-- 6. Políticas RLS para roles (eliminar existentes primero)
DROP POLICY IF EXISTS "HRB APU can view their own roles" ON public.roles;
DROP POLICY IF EXISTS "HRB APU can insert roles" ON public.roles;

CREATE POLICY "HRB APU can view their own roles"
ON public.roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "HRB APU can insert roles"
ON public.roles FOR INSERT
WITH CHECK (public.is_hrb_apu_any(auth.uid()));

-- 7. Políticas para tableros
DROP POLICY IF EXISTS "Public can view all tableros" ON public.tableros;
DROP POLICY IF EXISTS "Public can insert tableros" ON public.tableros;
DROP POLICY IF EXISTS "Public can update tableros" ON public.tableros;
DROP POLICY IF EXISTS "Public can delete tableros" ON public.tableros;
DROP POLICY IF EXISTS "Anonymous users can view tableros (demo mode)" ON public.tableros;
DROP POLICY IF EXISTS "Anonymous users can create tableros (demo mode)" ON public.tableros;
DROP POLICY IF EXISTS "HRB APU can manage tableros" ON public.tableros;
DROP POLICY IF EXISTS "Everyone can view tableros" ON public.tableros;

CREATE POLICY "HRB APU can manage tableros"
ON public.tableros FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.user_id = auth.uid()
      AND r.role = 'HRB APU'
      AND r.empresa_id = tableros.empresa_id
  )
);

CREATE POLICY "Everyone can view tableros"
ON public.tableros FOR SELECT
USING (true);

-- 8. Políticas para evaluaciones
DROP POLICY IF EXISTS "Public can view all evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Public can insert evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Public can update evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Public can delete evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Anonymous users can view evaluaciones (demo mode)" ON public.evaluaciones;
DROP POLICY IF EXISTS "Anonymous users can create evaluaciones (demo mode)" ON public.evaluaciones;
DROP POLICY IF EXISTS "Anonymous users can update evaluaciones (demo mode)" ON public.evaluaciones;
DROP POLICY IF EXISTS "Anonymous users can delete evaluaciones (demo mode)" ON public.evaluaciones;
DROP POLICY IF EXISTS "HRB APU can manage evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Everyone can view evaluaciones" ON public.evaluaciones;

CREATE POLICY "HRB APU can manage evaluaciones"
ON public.evaluaciones FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tableros t
    INNER JOIN public.roles r ON r.empresa_id = t.empresa_id
    WHERE t.id = evaluaciones.tablero_id
      AND r.user_id = auth.uid()
      AND r.role = 'HRB APU'
  )
);

CREATE POLICY "Everyone can view evaluaciones"
ON public.evaluaciones FOR SELECT
USING (true);

-- 9. Políticas para calibraciones
DROP POLICY IF EXISTS "Public can view all calibraciones" ON public.calibraciones;
DROP POLICY IF EXISTS "Public can insert calibraciones" ON public.calibraciones;
DROP POLICY IF EXISTS "Public can update calibraciones" ON public.calibraciones;
DROP POLICY IF EXISTS "Public can delete calibraciones" ON public.calibraciones;
DROP POLICY IF EXISTS "HRB APU can manage calibraciones" ON public.calibraciones;
DROP POLICY IF EXISTS "Everyone can view calibraciones" ON public.calibraciones;

CREATE POLICY "HRB APU can manage calibraciones"
ON public.calibraciones FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.user_id = auth.uid()
      AND r.role = 'HRB APU'
      AND (r.empresa_id = calibraciones.empresa_id OR calibraciones.empresa_id IS NULL)
  )
);

CREATE POLICY "Everyone can view calibraciones"
ON public.calibraciones FOR SELECT
USING (true);

-- 10. Políticas de equipos
DROP POLICY IF EXISTS "Public can view all equipos" ON public.equipos;
DROP POLICY IF EXISTS "HRB APU can manage equipos" ON public.equipos;
DROP POLICY IF EXISTS "HRB APU can update equipos" ON public.equipos;
DROP POLICY IF EXISTS "Everyone can view equipos" ON public.equipos;

CREATE POLICY "Everyone can view equipos"
ON public.equipos FOR SELECT
USING (true);

CREATE POLICY "HRB APU can manage equipos"
ON public.equipos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.user_id = auth.uid()
      AND r.role = 'HRB APU'
      AND r.empresa_id = equipos.empresa_id
  )
);

CREATE POLICY "HRB APU can update equipos"
ON public.equipos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.user_id = auth.uid()
      AND r.role = 'HRB APU'
      AND r.empresa_id = equipos.empresa_id
  )
);