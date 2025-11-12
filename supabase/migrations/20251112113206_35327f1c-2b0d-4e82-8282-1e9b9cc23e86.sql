-- 1. Agregar constraint UNIQUE en user_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'gauss_user_roles_user_id_key'
  ) THEN
    ALTER TABLE gauss_user_roles 
    ADD CONSTRAINT gauss_user_roles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 2. Insertar mary.mundarain con ON CONFLICT ahora que existe el constraint
INSERT INTO gauss_user_roles (user_id, email, role, paises_acceso)
VALUES (
  '7e653acd-b095-4d41-81ec-e9196016e963'::uuid,
  'mary.mundarain@seidor.com',
  'hrbp',
  ARRAY['Argentina', 'Uruguay', 'Paraguay']
)
ON CONFLICT (user_id) DO UPDATE 
SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  paises_acceso = EXCLUDED.paises_acceso;

-- 3. Normalizar países en calibracion_gauss basándose en el país del tablero asociado
-- Para Chile
UPDATE calibracion_gauss cg
SET pais = 'Chile'
FROM tableros t
WHERE cg.tablero_id = t.id
  AND t.pais = 'Chile'
  AND t.modulo_origen = 'gauss'
  AND cg.pais != 'Chile';

-- Para Uruguay  
UPDATE calibracion_gauss cg
SET pais = 'Uruguay'
FROM tableros t
WHERE cg.tablero_id = t.id
  AND t.pais = 'Uruguay'
  AND t.modulo_origen = 'gauss'
  AND cg.pais != 'Uruguay';

-- Para Argentina (normalizar mayúsculas)
UPDATE calibracion_gauss cg
SET pais = 'Argentina'
FROM tableros t
WHERE cg.tablero_id = t.id
  AND t.pais = 'Argentina'
  AND t.modulo_origen = 'gauss'
  AND cg.pais != 'Argentina';

-- Para Paraguay (si existen)
UPDATE calibracion_gauss cg
SET pais = 'Paraguay'
FROM tableros t
WHERE cg.tablero_id = t.id
  AND t.pais = 'Paraguay'
  AND t.modulo_origen = 'gauss'
  AND cg.pais != 'Paraguay';