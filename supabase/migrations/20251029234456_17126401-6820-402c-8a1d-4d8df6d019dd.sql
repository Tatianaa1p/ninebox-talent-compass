-- Asignar rol "manager cl" a tatiana.pina@seidor.com en empresa Chile
-- Sin modificar roles existentes en otras empresas

INSERT INTO public.empresas_usuarios (empresa_id, user_id, role)
VALUES (
  'c55dc42c-bada-4c07-a80b-665ac4d374ca', -- Chile
  '04a354df-f7d2-48a3-ac45-c827ae2a446a', -- tatiana.pina@seidor.com
  'manager cl'
)
ON CONFLICT (empresa_id, user_id) 
DO UPDATE SET role = EXCLUDED.role;