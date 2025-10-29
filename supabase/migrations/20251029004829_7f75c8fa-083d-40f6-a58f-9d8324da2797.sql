-- SI EXISTE LA TABLA users → HABILITA RLS + POLÍTICA
DO $$  
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "allow_all_temp" ON public.users;

    CREATE POLICY "user_see_own_user" ON public.users
    FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END   $$;