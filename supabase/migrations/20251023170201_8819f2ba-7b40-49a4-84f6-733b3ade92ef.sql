-- Create user_permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  empresas_acceso text[] NOT NULL DEFAULT '{}',
  permisos_globales jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own permissions
CREATE POLICY "Users can view their own permissions"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can manage all permissions
CREATE POLICY "Admins can manage all permissions"
ON public.user_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert permissions for specific users
INSERT INTO public.user_permissions (user_id, role, empresas_acceso, permisos_globales)
VALUES 
  ('04a354df-f7d2-48a3-ac45-c827ae2a446a', 'hrbp', ARRAY['Argentina', 'Uruguay', 'Paraguay'], '{"crear_tableros": true, "calibrar_tableros": true, "ver_equipos": true}'::jsonb),
  ('45f2a400-8b30-4902-b35f-59fb5f97baaa', 'hrbp', ARRAY['Argentina', 'Uruguay', 'Paraguay'], '{"crear_tableros": true, "calibrar_tableros": true, "ver_equipos": true}'::jsonb),
  ('743686df-58bd-4129-b571-c21e9beff378', 'hrbp', ARRAY['Argentina', 'Uruguay', 'Paraguay'], '{"crear_tableros": true, "calibrar_tableros": true, "ver_equipos": true}'::jsonb),
  ('7e653acd-b095-4d41-81ec-e9196016e963', 'hrbp', ARRAY['Argentina', 'Uruguay', 'Paraguay'], '{"crear_tableros": true, "calibrar_tableros": true, "ver_equipos": true}'::jsonb)
ON CONFLICT (user_id) DO UPDATE
SET 
  role = EXCLUDED.role,
  empresas_acceso = EXCLUDED.empresas_acceso,
  permisos_globales = EXCLUDED.permisos_globales,
  updated_at = now();

-- Create security definer function to check if user has access to empresa
CREATE OR REPLACE FUNCTION public.user_has_empresa_access(_user_id uuid, _empresa_nombre text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND _empresa_nombre = ANY(empresas_acceso)
  )
$$;

-- Create security definer function to check user permission
CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permisos_globales->>_permission = 'true'
  )
$$;

-- Update empresas policies to use new permission system
DROP POLICY IF EXISTS "Anónimos pueden ver empresas" ON public.empresas;
DROP POLICY IF EXISTS "Anónimos ven empresas" ON public.empresas;
DROP POLICY IF EXISTS "Autenticados ven todas las empresas" ON public.empresas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver empresas" ON public.empresas;
DROP POLICY IF EXISTS "empresas_select_all" ON public.empresas;

CREATE POLICY "Users can view empresas they have access to"
ON public.empresas
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR public.user_has_empresa_access(auth.uid(), nombre)
);

-- Update equipos policies
DROP POLICY IF EXISTS "Anónimos ven equipos" ON public.equipos;
DROP POLICY IF EXISTS "Autenticados ven todos los equipos" ON public.equipos;
DROP POLICY IF EXISTS "equipos_select_all" ON public.equipos;

CREATE POLICY "Users can view equipos in allowed empresas"
ON public.equipos
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = equipos.empresa_id
      AND public.user_has_empresa_access(auth.uid(), e.nombre)
  )
);

-- Update equipos insert/update/delete policies for users with permissions
CREATE POLICY "Users with permissions can manage equipos"
ON public.equipos
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR (
    public.user_has_permission(auth.uid(), 'crear_tableros')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = equipos.empresa_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR (
    public.user_has_permission(auth.uid(), 'crear_tableros')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = equipos.empresa_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
);

-- Update tableros policies
DROP POLICY IF EXISTS "Users can view tableros in their companies" ON public.tableros;
DROP POLICY IF EXISTS "HRBP can manage tableros" ON public.tableros;
DROP POLICY IF EXISTS "Managers can manage team tableros" ON public.tableros;

CREATE POLICY "Users can view tableros in allowed empresas"
ON public.tableros
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = tableros.empresa_id
      AND public.user_has_empresa_access(auth.uid(), e.nombre)
  )
);

CREATE POLICY "Users with permissions can manage tableros"
ON public.tableros
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR (
    public.user_has_permission(auth.uid(), 'crear_tableros')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = tableros.empresa_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR (
    public.user_has_permission(auth.uid(), 'crear_tableros')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = tableros.empresa_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
);

-- Update empleados policies
DROP POLICY IF EXISTS "HRB APU - Empleados" ON public.empleados;
DROP POLICY IF EXISTS "Manager - Acceso Total Empleados" ON public.empleados;
DROP POLICY IF EXISTS "Manager - empleados Total" ON public.empleados;

CREATE POLICY "Users can view empleados in allowed empresas"
ON public.empleados
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.tableros t
    JOIN public.empresas e ON e.id = t.empresa_id
    WHERE t.id = empleados.tablero_id
      AND public.user_has_empresa_access(auth.uid(), e.nombre)
  )
);

CREATE POLICY "Users with permissions can manage empleados"
ON public.empleados
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR (
    public.user_has_permission(auth.uid(), 'calibrar_tableros')
    AND EXISTS (
      SELECT 1 FROM public.tableros t
      JOIN public.empresas e ON e.id = t.empresa_id
      WHERE t.id = empleados.tablero_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR (
    public.user_has_permission(auth.uid(), 'calibrar_tableros')
    AND EXISTS (
      SELECT 1 FROM public.tableros t
      JOIN public.empresas e ON e.id = t.empresa_id
      WHERE t.id = empleados.tablero_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
);

-- Update evaluaciones policies
DROP POLICY IF EXISTS "HRB APU - Evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Manager - Acceso Total Evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Manager - evaluaciones Total" ON public.evaluaciones;

CREATE POLICY "Users can view evaluaciones in allowed empresas"
ON public.evaluaciones
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = evaluaciones.empresa_id
      AND public.user_has_empresa_access(auth.uid(), e.nombre)
  )
);

CREATE POLICY "Users with permissions can manage evaluaciones"
ON public.evaluaciones
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR (
    public.user_has_permission(auth.uid(), 'calibrar_tableros')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = evaluaciones.empresa_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR (
    public.user_has_permission(auth.uid(), 'calibrar_tableros')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = evaluaciones.empresa_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
);

-- Update calibraciones policies
DROP POLICY IF EXISTS "HRB APU - Calibraciones" ON public.calibraciones;
DROP POLICY IF EXISTS "Manager - Acceso Total Calibraciones" ON public.calibraciones;
DROP POLICY IF EXISTS "Manager - calibraciones Total" ON public.calibraciones;

CREATE POLICY "Users can view calibraciones in allowed empresas"
ON public.calibraciones
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = calibraciones.empresa_id
      AND public.user_has_empresa_access(auth.uid(), e.nombre)
  )
);

CREATE POLICY "Users with permissions can manage calibraciones"
ON public.calibraciones
FOR ALL
USING (
  has_role(auth.uid(), 'admin')
  OR (
    public.user_has_permission(auth.uid(), 'calibrar_tableros')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = calibraciones.empresa_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR (
    public.user_has_permission(auth.uid(), 'calibrar_tableros')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = calibraciones.empresa_id
        AND public.user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();