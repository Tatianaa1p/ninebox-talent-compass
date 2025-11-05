-- Add pais field to tableros and make equipo_id optional
ALTER TABLE public.tableros
ADD COLUMN IF NOT EXISTS pais TEXT;

ALTER TABLE public.tableros
ALTER COLUMN equipo_id DROP NOT NULL;

-- Create index for faster país-based queries
CREATE INDEX IF NOT EXISTS idx_tableros_pais ON public.tableros(pais);

-- Add check constraint to ensure either equipo_id or pais is set
ALTER TABLE public.tableros
ADD CONSTRAINT tableros_equipo_or_pais_check
CHECK (equipo_id IS NOT NULL OR pais IS NOT NULL);