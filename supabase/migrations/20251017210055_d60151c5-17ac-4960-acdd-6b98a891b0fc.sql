-- Insert HRBP users into user_roles
-- These users must be registered in auth.users first

INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'hrbp'::app_role
FROM auth.users au
WHERE au.email IN (
  'maria.curci@seidor.com',
  'agustinabelen.garcia@seidor.com',
  'mary.mundarain@seidor.com'
)
ON CONFLICT (user_id, role) DO NOTHING;