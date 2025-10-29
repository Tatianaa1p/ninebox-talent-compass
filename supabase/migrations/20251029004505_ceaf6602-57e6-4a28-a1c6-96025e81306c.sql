-- HABILITA RLS EN profiles (si no está)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- BORRA POLÍTICA TEMPORAL (solo en profiles)
DROP POLICY IF EXISTS "allow_all_temp" ON public.profiles;

-- POLÍTICA CORRECTA: usuario ve solo su perfil
CREATE POLICY "user_see_own_profile" ON public.profiles
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());