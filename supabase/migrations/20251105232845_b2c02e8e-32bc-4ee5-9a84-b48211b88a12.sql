-- Add modulo_origen column to tableros table to separate Gauss from Ninebox
ALTER TABLE public.tableros 
ADD COLUMN modulo_origen text DEFAULT 'ninebox' CHECK (modulo_origen IN ('gauss', 'ninebox'));

-- Update existing tableros to have ninebox as modulo_origen (backward compatibility)
UPDATE public.tableros 
SET modulo_origen = 'ninebox' 
WHERE modulo_origen IS NULL;

-- Make modulo_origen NOT NULL after setting default values
ALTER TABLE public.tableros 
ALTER COLUMN modulo_origen SET NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_tableros_modulo_origen ON public.tableros(modulo_origen);

-- Add comment for documentation
COMMENT ON COLUMN public.tableros.modulo_origen IS 'Origin module: gauss for Gaussian Curve module, ninebox for Ninebox Talent module';