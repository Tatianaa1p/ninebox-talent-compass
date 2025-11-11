-- ============================================
-- CORRECCIÓN DE RLS POLICIES PARA CHILE
-- Solo afecta al módulo Curva de Gauss
-- ============================================

-- 1. DROP existing Gauss policies on tableros
DROP POLICY IF EXISTS "gauss_select_tableros" ON public.tableros;
DROP POLICY IF EXISTS "gauss_insert_tableros" ON public.tableros;
DROP POLICY IF EXISTS "gauss_update_tableros" ON public.tableros;
DROP POLICY IF EXISTS "gauss_delete_tableros" ON public.tableros;

-- 2. CREATE new Gauss policies with case-insensitive country matching
CREATE POLICY "gauss_select_tableros" ON public.tableros
  FOR SELECT
  TO authenticated
  USING (
    modulo_origen = 'gauss'
    AND EXISTS (
      SELECT 1 FROM gauss_user_roles gur
      WHERE gur.user_id = auth.uid()
        AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
        AND (
          -- Case-insensitive country match
          EXISTS (
            SELECT 1 FROM unnest(gur.paises_acceso) AS pais_permitido
            WHERE LOWER(pais_permitido) = LOWER(tableros.pais)
          )
        )
    )
  );

CREATE POLICY "gauss_insert_tableros" ON public.tableros
  FOR INSERT
  TO authenticated
  WITH CHECK (
    modulo_origen = 'gauss'
    AND EXISTS (
      SELECT 1 FROM gauss_user_roles gur
      WHERE gur.user_id = auth.uid()
        AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
        AND (
          -- Case-insensitive country match
          EXISTS (
            SELECT 1 FROM unnest(gur.paises_acceso) AS pais_permitido
            WHERE LOWER(pais_permitido) = LOWER(tableros.pais)
          )
        )
    )
  );

CREATE POLICY "gauss_update_tableros" ON public.tableros
  FOR UPDATE
  TO authenticated
  USING (
    modulo_origen = 'gauss'
    AND EXISTS (
      SELECT 1 FROM gauss_user_roles gur
      WHERE gur.user_id = auth.uid()
        AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
        AND (
          -- Case-insensitive country match
          EXISTS (
            SELECT 1 FROM unnest(gur.paises_acceso) AS pais_permitido
            WHERE LOWER(pais_permitido) = LOWER(tableros.pais)
          )
        )
    )
  )
  WITH CHECK (
    modulo_origen = 'gauss'
    AND EXISTS (
      SELECT 1 FROM gauss_user_roles gur
      WHERE gur.user_id = auth.uid()
        AND (
          -- Case-insensitive country match
          EXISTS (
            SELECT 1 FROM unnest(gur.paises_acceso) AS pais_permitido
            WHERE LOWER(pais_permitido) = LOWER(tableros.pais)
          )
        )
    )
  );

CREATE POLICY "gauss_delete_tableros" ON public.tableros
  FOR DELETE
  TO authenticated
  USING (
    modulo_origen = 'gauss'
    AND EXISTS (
      SELECT 1 FROM gauss_user_roles gur
      WHERE gur.user_id = auth.uid()
        AND gur.role IN ('hrbp', 'hrbp_cl', 'hrbp_apu')  -- Only HRBPs can delete
        AND (
          -- Case-insensitive country match
          EXISTS (
            SELECT 1 FROM unnest(gur.paises_acceso) AS pais_permitido
            WHERE LOWER(pais_permitido) = LOWER(tableros.pais)
          )
        )
    )
  );

-- 3. UPDATE calibracion_gauss policies for case-insensitive matching
DROP POLICY IF EXISTS "CurvaGauss users can view calibrations" ON public.calibracion_gauss;
DROP POLICY IF EXISTS "CurvaGauss users can insert calibrations" ON public.calibracion_gauss;
DROP POLICY IF EXISTS "CurvaGauss users can update calibrations" ON public.calibracion_gauss;
DROP POLICY IF EXISTS "CurvaGauss users can delete calibrations" ON public.calibracion_gauss;

CREATE POLICY "CurvaGauss users can view calibrations" ON public.calibracion_gauss
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM tableros t
      JOIN gauss_user_roles gur ON gur.user_id = auth.uid()
      WHERE t.id = calibracion_gauss.tablero_id
        AND t.modulo_origen = 'gauss'
        AND (
          -- Case-insensitive country match
          EXISTS (
            SELECT 1 FROM unnest(gur.paises_acceso) AS pais_permitido
            WHERE LOWER(pais_permitido) = LOWER(t.pais)
          )
        )
        AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
    )
  );

CREATE POLICY "CurvaGauss users can insert calibrations" ON public.calibracion_gauss
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM tableros t
      JOIN gauss_user_roles gur ON gur.user_id = auth.uid()
      WHERE t.id = calibracion_gauss.tablero_id
        AND t.modulo_origen = 'gauss'
        AND (
          -- Case-insensitive country match
          EXISTS (
            SELECT 1 FROM unnest(gur.paises_acceso) AS pais_permitido
            WHERE LOWER(pais_permitido) = LOWER(t.pais)
          )
        )
        AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl')
    )
  );

CREATE POLICY "CurvaGauss users can update calibrations" ON public.calibracion_gauss
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM tableros t
      JOIN gauss_user_roles gur ON gur.user_id = auth.uid()
      WHERE t.id = calibracion_gauss.tablero_id
        AND t.modulo_origen = 'gauss'
        AND (
          -- Case-insensitive country match
          EXISTS (
            SELECT 1 FROM unnest(gur.paises_acceso) AS pais_permitido
            WHERE LOWER(pais_permitido) = LOWER(t.pais)
          )
        )
        AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM tableros t
      JOIN gauss_user_roles gur ON gur.user_id = auth.uid()
      WHERE t.id = calibracion_gauss.tablero_id
        AND t.modulo_origen = 'gauss'
        AND (
          -- Case-insensitive country match
          EXISTS (
            SELECT 1 FROM unnest(gur.paises_acceso) AS pais_permitido
            WHERE LOWER(pais_permitido) = LOWER(t.pais)
          )
        )
        AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
    )
  );

CREATE POLICY "CurvaGauss users can delete calibrations" ON public.calibracion_gauss
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM tableros t
      JOIN gauss_user_roles gur ON gur.user_id = auth.uid()
      WHERE t.id = calibracion_gauss.tablero_id
        AND t.modulo_origen = 'gauss'
        AND (
          -- Case-insensitive country match
          EXISTS (
            SELECT 1 FROM unnest(gur.paises_acceso) AS pais_permitido
            WHERE LOWER(pais_permitido) = LOWER(t.pais)
          )
        )
        AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
    )
  );