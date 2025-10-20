-- Drop existing restrictive policies and add public access policies

-- Policies for evaluaciones table
DROP POLICY IF EXISTS "Managers can view their evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "Managers can insert evaluaciones for their teams" ON evaluaciones;
DROP POLICY IF EXISTS "Managers can update evaluaciones for their teams" ON evaluaciones;
DROP POLICY IF EXISTS "Managers can delete evaluaciones for their teams" ON evaluaciones;
DROP POLICY IF EXISTS "HRBP can view all evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "HRBP can insert evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "HRBP can update evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "HRBP can delete evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "Authenticated users can view evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "Authenticated users can insert evaluaciones" ON evaluaciones;

-- Add public access policies for evaluaciones
CREATE POLICY "Public can view all evaluaciones"
ON evaluaciones FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can insert evaluaciones"
ON evaluaciones FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can update evaluaciones"
ON evaluaciones FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete evaluaciones"
ON evaluaciones FOR DELETE
TO public
USING (true);

-- Policies for calibraciones table
DROP POLICY IF EXISTS "Authenticated users can view calibraciones" ON calibraciones;
DROP POLICY IF EXISTS "Authenticated users can insert calibraciones" ON calibraciones;
DROP POLICY IF EXISTS "Anonymous users can view calibraciones (demo mode)" ON calibraciones;
DROP POLICY IF EXISTS "Anonymous users can insert calibraciones (demo mode)" ON calibraciones;

-- Add public access policies for calibraciones
CREATE POLICY "Public can view all calibraciones"
ON calibraciones FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can insert calibraciones"
ON calibraciones FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can update calibraciones"
ON calibraciones FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete calibraciones"
ON calibraciones FOR DELETE
TO public
USING (true);

-- Policies for tableros table
DROP POLICY IF EXISTS "Managers can view their tableros" ON tableros;
DROP POLICY IF EXISTS "Managers can insert tableros for their teams" ON tableros;
DROP POLICY IF EXISTS "Authenticated users can insert tableros for their teams" ON tableros;
DROP POLICY IF EXISTS "HRBP can view all tableros" ON tableros;
DROP POLICY IF EXISTS "HRBP can insert tableros" ON tableros;
DROP POLICY IF EXISTS "HRBP can update tableros" ON tableros;
DROP POLICY IF EXISTS "HRBP can delete tableros" ON tableros;
DROP POLICY IF EXISTS "tableros_select_any_auth" ON tableros;
DROP POLICY IF EXISTS "tableros_select_hrbp" ON tableros;
DROP POLICY IF EXISTS "tableros_select_members" ON tableros;
DROP POLICY IF EXISTS "tableros_insert_hrbp" ON tableros;
DROP POLICY IF EXISTS "tableros_access" ON tableros;

-- Add public access policies for tableros
CREATE POLICY "Public can view all tableros"
ON tableros FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can insert tableros"
ON tableros FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can update tableros"
ON tableros FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete tableros"
ON tableros FOR DELETE
TO public
USING (true);

-- Policies for empresas table (keep existing policies but add public SELECT)
CREATE POLICY "Public can view all empresas"
ON empresas FOR SELECT
TO public
USING (true);

-- Policies for equipos table (keep existing policies but add public SELECT)
CREATE POLICY "Public can view all equipos"
ON equipos FOR SELECT
TO public
USING (true);