-- ELIMINA POLÍTICAS SI EXISTEN
DROP POLICY IF EXISTS "allow_all_temp" ON public.evaluaciones;
DROP POLICY IF EXISTS "allow_all_temp" ON public.empleados;
DROP POLICY IF EXISTS "allow_all_temp" ON public.profiles;

-- HABILITA RLS (NO AFECTA AÚN)
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- POLÍTICA TEMPORAL: TODOS LOS USUARIOS AUTENTICADOS PUEDEN TODO
CREATE POLICY "allow_all_temp" ON public.evaluaciones
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_temp" ON public.empleados
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_temp" ON public.profiles
FOR ALL TO authenticated USING (true) WITH CHECK (true);