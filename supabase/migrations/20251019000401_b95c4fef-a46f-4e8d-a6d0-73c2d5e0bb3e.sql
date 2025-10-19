-- Habilitar RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios vean sus propios roles
CREATE POLICY "user_roles_select_self"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());