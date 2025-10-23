-- Update RLS policies to check for BOTH calibrar_tableros AND calibrar_ninebox permissions

-- Drop existing policies
DROP POLICY IF EXISTS "Users with permissions can manage calibraciones" ON public.calibraciones;
DROP POLICY IF EXISTS "Users with permissions can manage evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Users with permissions can manage empleados" ON public.empleados;

-- Recreate calibraciones policy with both permissions
CREATE POLICY "Users with permissions can manage calibraciones"
ON public.calibraciones
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (
    (
      user_has_permission(auth.uid(), 'calibrar_tableros') OR 
      user_has_permission(auth.uid(), 'calibrar_ninebox')
    ) AND
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = calibraciones.empresa_id 
      AND user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (
    (
      user_has_permission(auth.uid(), 'calibrar_tableros') OR 
      user_has_permission(auth.uid(), 'calibrar_ninebox')
    ) AND
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = calibraciones.empresa_id 
      AND user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
);

-- Recreate evaluaciones policy with both permissions
CREATE POLICY "Users with permissions can manage evaluaciones"
ON public.evaluaciones
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (
    (
      user_has_permission(auth.uid(), 'calibrar_tableros') OR 
      user_has_permission(auth.uid(), 'calibrar_ninebox')
    ) AND
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = evaluaciones.empresa_id 
      AND user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (
    (
      user_has_permission(auth.uid(), 'calibrar_tableros') OR 
      user_has_permission(auth.uid(), 'calibrar_ninebox')
    ) AND
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = evaluaciones.empresa_id 
      AND user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
);

-- Recreate empleados policy with both permissions
CREATE POLICY "Users with permissions can manage empleados"
ON public.empleados
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (
    (
      user_has_permission(auth.uid(), 'calibrar_tableros') OR 
      user_has_permission(auth.uid(), 'calibrar_ninebox')
    ) AND
    EXISTS (
      SELECT 1 FROM tableros t
      JOIN empresas e ON e.id = t.empresa_id
      WHERE t.id = empleados.tablero_id 
      AND user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (
    (
      user_has_permission(auth.uid(), 'calibrar_tableros') OR 
      user_has_permission(auth.uid(), 'calibrar_ninebox')
    ) AND
    EXISTS (
      SELECT 1 FROM tableros t
      JOIN empresas e ON e.id = t.empresa_id
      WHERE t.id = empleados.tablero_id 
      AND user_has_empresa_access(auth.uid(), e.nombre)
    )
  )
);