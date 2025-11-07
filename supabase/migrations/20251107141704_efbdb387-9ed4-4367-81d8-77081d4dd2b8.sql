-- Fix RLS policies for Curva Gauss module

-- ============================================
-- POLÍTICAS PARA TABLEROS (módulo gauss)
-- ============================================

-- Drop existing restrictive policies for gauss tableros
DROP POLICY IF EXISTS "HRBP and Managers can view tableros" ON tableros;
DROP POLICY IF EXISTS "HRBP and Managers can create tableros" ON tableros;
DROP POLICY IF EXISTS "HRBP and Managers can update tableros" ON tableros;
DROP POLICY IF EXISTS "HRBP and Managers can delete tableros" ON tableros;

-- CREATE: Allow users with gauss roles to view tableros filtered by country and module
CREATE POLICY "Gauss users can view their tableros by country"
ON tableros
FOR SELECT
TO authenticated
USING (
  modulo_origen = 'gauss' 
  AND (
    -- User created this tablero
    EXISTS (
      SELECT 1 FROM gauss_user_roles gur
      WHERE gur.user_id = auth.uid()
    )
    -- AND country matches user's paises_acceso
    AND (
      pais = ANY(
        SELECT unnest(paises_acceso)
        FROM gauss_user_roles
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- CREATE: Allow gauss users to insert tableros for their countries
CREATE POLICY "Gauss users can create tableros for their countries"
ON tableros
FOR INSERT
TO authenticated
WITH CHECK (
  modulo_origen = 'gauss'
  AND pais = ANY(
    SELECT unnest(paises_acceso)
    FROM gauss_user_roles
    WHERE user_id = auth.uid()
  )
  AND has_any_gauss_role(auth.uid())
);

-- CREATE: Allow gauss users to update tableros in their countries
CREATE POLICY "Gauss users can update tableros in their countries"
ON tableros
FOR UPDATE
TO authenticated
USING (
  modulo_origen = 'gauss'
  AND pais = ANY(
    SELECT unnest(paises_acceso)
    FROM gauss_user_roles
    WHERE user_id = auth.uid()
  )
  AND has_any_gauss_role(auth.uid())
)
WITH CHECK (
  modulo_origen = 'gauss'
  AND pais = ANY(
    SELECT unnest(paises_acceso)
    FROM gauss_user_roles
    WHERE user_id = auth.uid()
  )
);

-- CREATE: Allow gauss users to delete tableros in their countries
CREATE POLICY "Gauss users can delete tableros in their countries"
ON tableros
FOR DELETE
TO authenticated
USING (
  modulo_origen = 'gauss'
  AND pais = ANY(
    SELECT unnest(paises_acceso)
    FROM gauss_user_roles
    WHERE user_id = auth.uid()
  )
  AND has_any_gauss_role(auth.uid())
);

-- ============================================
-- POLÍTICAS PARA CALIBRACION_GAUSS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "HRBP and Managers can view all calibrations" ON calibracion_gauss;
DROP POLICY IF EXISTS "HRBP and Managers can insert calibrations" ON calibracion_gauss;
DROP POLICY IF EXISTS "HRBP and Managers can update calibrations" ON calibracion_gauss;
DROP POLICY IF EXISTS "HRBP and Managers can delete calibrations" ON calibracion_gauss;

-- CREATE: Allow viewing calibrations for user's accessible countries
CREATE POLICY "Gauss users can view calibrations in their countries"
ON calibracion_gauss
FOR SELECT
TO authenticated
USING (
  pais = ANY(
    SELECT unnest(paises_acceso)
    FROM gauss_user_roles
    WHERE user_id = auth.uid()
  )
  AND has_any_gauss_role(auth.uid())
);

-- CREATE: Allow inserting calibrations for accessible countries
CREATE POLICY "Gauss users can insert calibrations in their countries"
ON calibracion_gauss
FOR INSERT
TO authenticated
WITH CHECK (
  pais = ANY(
    SELECT unnest(paises_acceso)
    FROM gauss_user_roles
    WHERE user_id = auth.uid()
  )
  AND has_any_gauss_role(auth.uid())
);

-- CREATE: Allow updating calibrations for accessible countries
CREATE POLICY "Gauss users can update calibrations in their countries"
ON calibracion_gauss
FOR UPDATE
TO authenticated
USING (
  pais = ANY(
    SELECT unnest(paises_acceso)
    FROM gauss_user_roles
    WHERE user_id = auth.uid()
  )
  AND has_any_gauss_role(auth.uid())
)
WITH CHECK (
  pais = ANY(
    SELECT unnest(paises_acceso)
    FROM gauss_user_roles
    WHERE user_id = auth.uid()
  )
);

-- CREATE: Allow deleting calibrations for accessible countries
CREATE POLICY "Gauss users can delete calibrations in their countries"
ON calibracion_gauss
FOR DELETE
TO authenticated
USING (
  pais = ANY(
    SELECT unnest(paises_acceso)
    FROM gauss_user_roles
    WHERE user_id = auth.uid()
  )
  AND has_any_gauss_role(auth.uid())
);