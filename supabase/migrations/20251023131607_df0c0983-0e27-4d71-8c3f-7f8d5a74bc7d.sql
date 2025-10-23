-- =====================================================
-- SECURITY FIX: Remove Anonymous Access & Add Protections
-- =====================================================

-- 1. REMOVE ALL ANONYMOUS ACCESS POLICIES (CRITICAL)
-- This eliminates the security vulnerability allowing anyone to access data

DROP POLICY IF EXISTS "Anonymous users can view empleados (demo mode)" ON empleados;
DROP POLICY IF EXISTS "Anonymous users can insert empleados (demo mode)" ON empleados;
DROP POLICY IF EXISTS "Anonymous users can update empleados (demo mode)" ON empleados;
DROP POLICY IF EXISTS "Anonymous users can delete empleados (demo mode)" ON empleados;
DROP POLICY IF EXISTS "Anonymous users can view empresas (demo mode)" ON empresas;
DROP POLICY IF EXISTS "Demo anonymous read for empresas" ON empresas;
DROP POLICY IF EXISTS "Anonymous users can view equipos (demo mode)" ON equipos;
DROP POLICY IF EXISTS "Everyone can view evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "Everyone can view calibraciones" ON calibraciones;
DROP POLICY IF EXISTS "Everyone can view tableros" ON tableros;
DROP POLICY IF EXISTS "Everyone can view equipos" ON equipos;
DROP POLICY IF EXISTS "Public can view all empresas" ON empresas;
DROP POLICY IF EXISTS "Public Select - Empresas" ON empresas;
DROP POLICY IF EXISTS "Public Select - Equipos" ON equipos;
DROP POLICY IF EXISTS "Public Select - Empleados" ON empleados;
DROP POLICY IF EXISTS "Public Select - Evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "Public Select - Calibraciones" ON calibraciones;
DROP POLICY IF EXISTS "Public Select - Tableros" ON tableros;
DROP POLICY IF EXISTS "Public Select - Empresas Usuarios" ON empresas_usuarios;

-- 2. ADD CONFIG TABLE POLICIES (it had RLS enabled but no policies)
-- Allow admins and HRBP to manage configuration
CREATE POLICY "Admins and HRBP can manage config"
  ON config FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hrbp'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hrbp'::app_role));

-- Allow authenticated users to read config
CREATE POLICY "Authenticated users can read config"
  ON config FOR SELECT
  TO authenticated
  USING (true);

-- 3. ADD INPUT VALIDATION CONSTRAINTS
-- Ensure employee/person names are within reasonable bounds
ALTER TABLE empleados 
  ADD CONSTRAINT empleados_nombre_length 
  CHECK (length(nombre) >= 2 AND length(nombre) <= 100);

ALTER TABLE evaluaciones 
  ADD CONSTRAINT evaluaciones_persona_nombre_length 
  CHECK (length(persona_nombre) >= 2 AND length(persona_nombre) <= 100);

-- Ensure empresa names are valid
ALTER TABLE empresas 
  ADD CONSTRAINT empresas_nombre_length 
  CHECK (length(nombre) >= 2 AND length(nombre) <= 100);

-- Ensure equipo names are valid
ALTER TABLE equipos 
  ADD CONSTRAINT equipos_nombre_length 
  CHECK (length(nombre) >= 2 AND length(nombre) <= 100);

-- Ensure tablero names are valid
ALTER TABLE tableros 
  ADD CONSTRAINT tableros_nombre_length 
  CHECK (length(nombre) >= 2 AND length(nombre) <= 100);

COMMENT ON POLICY "Admins and HRBP can manage config" ON config IS 'Security fix: Added RLS policies to config table';
COMMENT ON CONSTRAINT empleados_nombre_length ON empleados IS 'Security fix: Input validation for employee names';
COMMENT ON CONSTRAINT evaluaciones_persona_nombre_length ON evaluaciones IS 'Security fix: Input validation for evaluation person names';