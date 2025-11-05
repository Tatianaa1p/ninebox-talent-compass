-- First, update existing tableros without pais to have a default value
UPDATE public.tableros
SET pais = 'Argentina'
WHERE pais IS NULL;

-- Now drop the old constraint
ALTER TABLE public.tableros
DROP CONSTRAINT IF EXISTS tableros_equipo_or_pais_check;

-- Make empresa_id nullable
ALTER TABLE public.tableros
ALTER COLUMN empresa_id DROP NOT NULL;