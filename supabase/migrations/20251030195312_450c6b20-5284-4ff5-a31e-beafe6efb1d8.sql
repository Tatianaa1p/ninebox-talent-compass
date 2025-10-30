-- Asignar rol manager a francisca.gutierrez@seidor.com en Chile
-- Usuario: 83994261-5bed-40bd-b84e-387a3cc1007e
-- Empresa: Chile (c55dc42c-bada-4c07-a80b-665ac4d374ca)

-- 1. Upsert en empresas_usuarios
INSERT INTO public.empresas_usuarios (user_id, empresa_id, role)
VALUES (
  '83994261-5bed-40bd-b84e-387a3cc1007e',
  'c55dc42c-bada-4c07-a80b-665ac4d374ca',
  'manager'
)
ON CONFLICT (user_id, empresa_id) 
DO UPDATE SET role = EXCLUDED.role;

-- 2. Upsert en user_permissions para dar permisos completos en Chile
INSERT INTO public.user_permissions (user_id, role, empresas_acceso, permisos_globales)
VALUES (
  '83994261-5bed-40bd-b84e-387a3cc1007e',
  'manager',
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
  role = CASE 
    WHEN 'manager' > user_permissions.role THEN EXCLUDED.role 
    ELSE user_permissions.role 
  END,
  empresas_acceso = CASE
    WHEN 'Chile' = ANY(user_permissions.empresas_acceso) THEN user_permissions.empresas_acceso
    ELSE array_append(user_permissions.empresas_acceso, 'Chile')
  END,
  permisos_globales = user_permissions.permisos_globales || EXCLUDED.permisos_globales,
  updated_at = now();