-- Agregar políticas RLS para rol 'manager' con acceso total

-- EMPRESAS: Manager puede hacer todo
CREATE POLICY "Manager - Acceso Total Empresas"
ON public.empresas
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- EQUIPOS: Manager puede hacer todo
CREATE POLICY "Manager - Acceso Total Equipos"
ON public.equipos
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- TABLEROS: Manager puede hacer todo
CREATE POLICY "Manager - Acceso Total Tableros"
ON public.tableros
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- EMPLEADOS: Manager puede hacer todo
CREATE POLICY "Manager - Acceso Total Empleados"
ON public.empleados
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- EVALUACIONES: Manager puede hacer todo
CREATE POLICY "Manager - Acceso Total Evaluaciones"
ON public.evaluaciones
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- CALIBRACIONES: Manager puede hacer todo
CREATE POLICY "Manager - Acceso Total Calibraciones"
ON public.calibraciones
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- EMPRESAS_USUARIOS: Manager puede hacer todo
CREATE POLICY "Manager - Acceso Total Empresas Usuarios"
ON public.empresas_usuarios
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- ROLES: Manager puede hacer todo
CREATE POLICY "Manager - Acceso Total Roles"
ON public.roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));