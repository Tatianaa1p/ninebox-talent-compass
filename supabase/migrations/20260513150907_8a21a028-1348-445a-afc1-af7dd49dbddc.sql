
INSERT INTO public.user_permissions (user_id, role, empresas_acceso, permisos_globales)
SELECT '5e2fecc1-1a96-4a3e-a830-eb25a4066bde', role, empresas_acceso, permisos_globales
FROM public.user_permissions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'francisca.gutierrez@seidor.com');

INSERT INTO public.gauss_user_roles (user_id, email, role, paises_acceso)
SELECT '5e2fecc1-1a96-4a3e-a830-eb25a4066bde', 'hans.baasch@seidor.com', role, paises_acceso
FROM public.gauss_user_roles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'francisca.gutierrez@seidor.com');
