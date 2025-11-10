-- CONSOLIDACIÓN FINAL DE POLÍTICAS RLS PARA CURVA DE GAUSS
-- Soluciona el problema de visualización de tableros
-- NO modifica ninguna política del módulo NineBox

-- ============================================
-- PASO 1: LIMPIAR POLÍTICAS DUPLICADAS DE TABLEROS (SOLO GAUSS)
-- ============================================

-- Eliminar todas las políticas existentes de Gauss en tableros
DROP POLICY IF EXISTS "Gauss users can view their tableros by country" ON tableros;
DROP POLICY IF EXISTS "Gauss users can create tableros for their countries" ON tableros;
DROP POLICY IF EXISTS "Gauss users can update tableros in their countries" ON tableros;
DROP POLICY IF EXISTS "Gauss users can delete tableros in their countries" ON tableros;

-- ============================================
-- PASO 2: CREAR POLÍTICAS CONSOLIDADAS Y SIMPLES
-- ============================================

-- POLÍTICA SELECT: Ver tableros de Gauss según países permitidos
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
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl')
      AND tableros.pais = ANY(gur.paises_acceso)
  )
);

-- POLÍTICA INSERT: Crear tableros solo en países permitidos
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
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl')
      AND pais = ANY(gur.paises_acceso)
  )
);

-- POLÍTICA UPDATE: Actualizar tableros solo en países permitidos
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
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl')
      AND tableros.pais = ANY(gur.paises_acceso)
  )
)
WITH CHECK (
  modulo_origen = 'gauss'
  AND EXISTS (
    SELECT 1
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      AND pais = ANY(gur.paises_acceso)
  )
);

-- POLÍTICA DELETE: Eliminar tableros solo en países permitidos (solo HRBP)
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
      AND gur.role IN ('hrbp', 'hrbp_cl')
      AND tableros.pais = ANY(gur.paises_acceso)
  )
);

-- ============================================
-- NOTA: Las políticas de NineBox NO se tocan
-- ============================================