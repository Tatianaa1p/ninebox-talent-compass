
-- 1. Trigger on_auth_user_created: no existe en la base de datos (verificado).
--    Función handle_new_user: no existe (verificado). No hay nada que eliminar.

-- Reaplicar política restrictiva en roles (idempotente)
DROP POLICY IF EXISTS "consolidated_roles_modify_authenticated" ON public.roles;
DROP POLICY IF EXISTS "roles_modify" ON public.roles;

CREATE POLICY "roles_modify"
ON public.roles FOR ALL TO authenticated
USING (public.up_is_admin(auth.uid()))
WITH CHECK (public.up_is_admin(auth.uid()));

-- 2. Sacar empleados de la publicación global de Realtime.
--    El código ya usa canal con filter tablero_id=eq.${selectedTablero},
--    que sigue funcionando sin estar en supabase_realtime.
ALTER PUBLICATION supabase_realtime DROP TABLE public.empleados;
