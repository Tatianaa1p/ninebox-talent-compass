-- Asignar rol hrbp cl al usuario en Chile
-- Usuario: 15519b16-12fd-4015-b6ac-fcce90815259
-- Empresa: Chile (c55dc42c-bada-4c07-a80b-665ac4d374ca)

-- 1. Upsert en empresas_usuarios
INSERT INTO public.empresas_usuarios (user_id, empresa_id, role)
VALUES (
  '15519b16-12fd-4015-b6ac-fcce90815259',
  'c55dc42c-bada-4c07-a80b-665ac4d374ca',
  'hrbp cl'
)
ON CONFLICT (user_id, empresa_id) 
DO UPDATE SET role = EXCLUDED.role;

-- 2. Upsert en user_permissions para dar permisos completos en Chile
INSERT INTO public.user_permissions (user_id, role, empresas_acceso, permisos_globales)
VALUES (
  '15519b16-12fd-4015-b6ac-fcce90815259',
  'hrbp',
  ARRAY['Chile'],
  jsonb_build_object(
    'crear_tableros', true,
    'calibrar_tableros', true,
    'ver_equipos', true,
    'calibrar_ninebox', true,
    'descargar_reportes', true
  )
)
ON CONFLICT (user_id)
DO UPDATE SET
  role = EXCLUDED.role,
  empresas_acceso = EXCLUDED.empresas_acceso,
  permisos_globales = EXCLUDED.permisos_globales,
  updated_at = now();

-- 3. Modificar política de equipos para excluir EC_Personas para este usuario específico
DROP POLICY IF EXISTS "Users can view equipos in allowed empresas" ON public.equipos;

CREATE POLICY "Users can view equipos in allowed empresas"
ON public.equipos
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    EXISTS (
      SELECT 1
      FROM empresas e
      WHERE e.id = equipos.empresa_id 
        AND user_has_empresa_access(auth.uid(), e.nombre)
    )
    -- Excluir EC_Personas para el usuario específico
    AND NOT (
      auth.uid() = '15519b16-12fd-4015-b6ac-fcce90815259'::uuid 
      AND equipos.nombre = 'EC_Personas'
    )
  )
);

-- 4. Modificar política de gestión de equipos para excluir EC_Personas
DROP POLICY IF EXISTS "Users with permissions can manage equipos" ON public.equipos;

CREATE POLICY "Users with permissions can manage equipos"
ON public.equipos
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    user_has_permission(auth.uid(), 'crear_tableros') 
    AND EXISTS (
      SELECT 1
      FROM empresas e
      WHERE e.id = equipos.empresa_id 
        AND user_has_empresa_access(auth.uid(), e.nombre)
    )
    -- Excluir EC_Personas para el usuario específico
    AND NOT (
      auth.uid() = '15519b16-12fd-4015-b6ac-fcce90815259'::uuid 
      AND equipos.nombre = 'EC_Personas'
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    user_has_permission(auth.uid(), 'crear_tableros') 
    AND EXISTS (
      SELECT 1
      FROM empresas e
      WHERE e.id = equipos.empresa_id 
        AND user_has_empresa_access(auth.uid(), e.nombre)
    )
    -- Excluir EC_Personas para el usuario específico
    AND NOT (
      auth.uid() = '15519b16-12fd-4015-b6ac-fcce90815259'::uuid 
      AND equipos.nombre = 'EC_Personas'
    )
  )
);

-- 5. Asegurar que tableros asociados a EC_Personas también estén excluidos
DROP POLICY IF EXISTS "manager_controla_cchh" ON public.tableros;

CREATE POLICY "manager_controla_cchh"
ON public.tableros
FOR ALL
USING (
  (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'manager'::app_role
    )
  ) 
  OR (
    EXISTS (
      SELECT 1
      FROM empresas_usuarios eu
      JOIN equipos eq ON eu.empresa_id = eq.empresa_id
      WHERE eu.user_id = auth.uid() 
        AND eq.id = tableros.equipo_id 
        AND eq.nombre !~~* '%capital humano%'
    )
    -- Excluir tableros del equipo EC_Personas para el usuario específico
    AND NOT (
      auth.uid() = '15519b16-12fd-4015-b6ac-fcce90815259'::uuid
      AND EXISTS (
        SELECT 1 FROM equipos
        WHERE equipos.id = tableros.equipo_id
          AND equipos.nombre = 'EC_Personas'
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'manager'::app_role
  )
);