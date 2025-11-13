
-- ============================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA CURVA DE GAUSS
-- Países: Chile, Argentina, Uruguay, Paraguay
-- ============================================

-- 1. ACTUALIZAR POLÍTICA DE ELIMINACIÓN DE TABLEROS
-- Permitir que managers y hrbp eliminen tableros de sus países asignados
DROP POLICY IF EXISTS "gauss_delete_tableros" ON tableros;

CREATE POLICY "gauss_delete_tableros"
ON tableros
FOR DELETE
TO authenticated
USING (
  modulo_origen = 'gauss' 
  AND EXISTS (
    SELECT 1 
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      -- Permitir roles hrbp Y manager de todas las variantes
      AND gur.role IN ('hrbp', 'hrbp_cl', 'hrbp_apu', 'manager', 'manager_cl', 'manager_apu')
      AND EXISTS (
        SELECT 1
        FROM unnest(gur.paises_acceso) AS pais_permitido
        WHERE lower(pais_permitido) = lower(tableros.pais)
      )
  )
);

-- 2. MEJORAR POLÍTICA DE VISUALIZACIÓN DE TABLEROS
-- Asegurar case-insensitive y incluir todos los roles relevantes
DROP POLICY IF EXISTS "gauss_select_tableros" ON tableros;

CREATE POLICY "gauss_select_tableros"
ON tableros
FOR SELECT
TO authenticated
USING (
  modulo_origen = 'gauss'
  AND EXISTS (
    SELECT 1
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
      AND EXISTS (
        SELECT 1
        FROM unnest(gur.paises_acceso) AS pais_permitido
        WHERE lower(pais_permitido) = lower(tableros.pais)
      )
  )
);

-- 3. VERIFICAR POLÍTICA DE ACTUALIZACIÓN DE TABLEROS
DROP POLICY IF EXISTS "gauss_update_tableros" ON tableros;

CREATE POLICY "gauss_update_tableros"
ON tableros
FOR UPDATE
TO authenticated
USING (
  modulo_origen = 'gauss'
  AND EXISTS (
    SELECT 1
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
      AND EXISTS (
        SELECT 1
        FROM unnest(gur.paises_acceso) AS pais_permitido
        WHERE lower(pais_permitido) = lower(tableros.pais)
      )
  )
)
WITH CHECK (
  modulo_origen = 'gauss'
  AND EXISTS (
    SELECT 1
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM unnest(gur.paises_acceso) AS pais_permitido
        WHERE lower(pais_permitido) = lower(tableros.pais)
      )
  )
);

-- 4. VERIFICAR POLÍTICA DE INSERCIÓN DE TABLEROS
DROP POLICY IF EXISTS "gauss_insert_tableros" ON tableros;

CREATE POLICY "gauss_insert_tableros"
ON tableros
FOR INSERT
TO authenticated
WITH CHECK (
  modulo_origen = 'gauss'
  AND EXISTS (
    SELECT 1
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
      AND EXISTS (
        SELECT 1
        FROM unnest(gur.paises_acceso) AS pais_permitido
        WHERE lower(pais_permitido) = lower(tableros.pais)
      )
  )
);

-- 5. ACTUALIZAR POLÍTICAS DE ELIMINACIÓN DE CALIBRACIONES
-- Permitir que managers también eliminen calibraciones
DROP POLICY IF EXISTS "CurvaGauss users can delete calibrations" ON calibracion_gauss;

CREATE POLICY "CurvaGauss users can delete calibrations"
ON calibracion_gauss
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tableros t
    JOIN gauss_user_roles gur ON gur.user_id = auth.uid()
    WHERE t.id = calibracion_gauss.tablero_id
      AND t.modulo_origen = 'gauss'
      AND EXISTS (
        SELECT 1
        FROM unnest(gur.paises_acceso) AS pais_permitido
        WHERE lower(pais_permitido) = lower(t.pais)
      )
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
  )
);