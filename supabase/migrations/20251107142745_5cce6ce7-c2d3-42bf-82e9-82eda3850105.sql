-- Restore RLS policies for ninebox module on tableros table
-- This fixes the issue where ninebox users cannot access their tableros

-- ============================================
-- POLÍTICAS PARA TABLEROS (módulo ninebox)
-- ============================================

-- Allow users with appropriate permissions to view ninebox tableros
CREATE POLICY "Ninebox users can view their tableros"
ON tableros
FOR SELECT
TO authenticated
USING (
  (modulo_origen = 'ninebox' OR modulo_origen IS NULL)
  AND (
    -- Users with hrbp or manager roles can view
    auth.uid() IN (
      SELECT user_id 
      FROM user_permissions
      WHERE role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl')
    )
    OR
    -- Users with access to the empresa can view
    EXISTS (
      SELECT 1 
      FROM empresas_usuarios eu
      WHERE eu.user_id = auth.uid() 
      AND eu.empresa_id = tableros.empresa_id
    )
    OR
    -- Users with access to the equipo can view
    EXISTS (
      SELECT 1
      FROM equipos eq
      JOIN empresas_usuarios eu ON eq.empresa_id = eu.empresa_id
      WHERE eu.user_id = auth.uid()
      AND eq.id = tableros.equipo_id
    )
  )
);

-- Allow users with crear_tableros permission to create ninebox tableros
CREATE POLICY "Ninebox users can create tableros"
ON tableros
FOR INSERT
TO authenticated
WITH CHECK (
  (modulo_origen = 'ninebox' OR modulo_origen IS NULL)
  AND (
    -- Users with crear_tableros permission
    EXISTS (
      SELECT 1
      FROM user_permissions
      WHERE user_id = auth.uid()
      AND (permisos_globales->>'crear_tableros')::boolean = true
    )
    OR
    -- Users with hrbp role
    auth.uid() IN (
      SELECT user_id 
      FROM user_permissions
      WHERE role IN ('hrbp', 'hrbp_cl')
    )
  )
);

-- Allow authorized users to update ninebox tableros
CREATE POLICY "Ninebox users can update tableros"
ON tableros
FOR UPDATE
TO authenticated
USING (
  (modulo_origen = 'ninebox' OR modulo_origen IS NULL)
  AND (
    auth.uid() IN (
      SELECT user_id 
      FROM user_permissions
      WHERE role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl')
    )
    OR
    EXISTS (
      SELECT 1 
      FROM empresas_usuarios eu
      WHERE eu.user_id = auth.uid() 
      AND eu.empresa_id = tableros.empresa_id
    )
  )
)
WITH CHECK (
  (modulo_origen = 'ninebox' OR modulo_origen IS NULL)
);

-- Allow authorized users to delete ninebox tableros
CREATE POLICY "Ninebox users can delete tableros"
ON tableros
FOR DELETE
TO authenticated
USING (
  (modulo_origen = 'ninebox' OR modulo_origen IS NULL)
  AND (
    auth.uid() IN (
      SELECT user_id 
      FROM user_permissions
      WHERE role IN ('hrbp', 'hrbp_cl')
    )
    OR
    EXISTS (
      SELECT 1
      FROM user_permissions
      WHERE user_id = auth.uid()
      AND (permisos_globales->>'crear_tableros')::boolean = true
    )
  )
);