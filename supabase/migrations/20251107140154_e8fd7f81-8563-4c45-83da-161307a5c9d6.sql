
-- Drop the incorrect policy that references non-existent e.empresa_id
DROP POLICY IF EXISTS "Permitir calibraciones dentro de la misma empresa" ON calibraciones;

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "consolidated_calibraciones_modify_authenticated" ON calibraciones;

-- Create updated policy that includes Chile roles (manager_cl, hrbp_cl)
CREATE POLICY "consolidated_calibraciones_modify_authenticated"
ON calibraciones
FOR ALL
TO authenticated
USING (
  (SELECT auth.uid()) IN (
    SELECT user_permissions.user_id
    FROM user_permissions
    WHERE user_permissions.role = ANY (ARRAY['hrbp', 'manager', 'hrbp_cl', 'manager_cl'])
      AND ((user_permissions.permisos_globales->>'calibrar_ninebox')::boolean = true)
  )
)
WITH CHECK (true);
