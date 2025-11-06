-- Add paises_acceso column to gauss_user_roles
ALTER TABLE public.gauss_user_roles
ADD COLUMN paises_acceso text[] DEFAULT '{}';

-- Update existing users with their allowed countries based on role
-- manager: all countries
UPDATE public.gauss_user_roles
SET paises_acceso = ARRAY['Argentina', 'Uruguay', 'Paraguay', 'Chile']
WHERE role = 'manager';

-- hrbp: ARG, URU, PAR
UPDATE public.gauss_user_roles
SET paises_acceso = ARRAY['Argentina', 'Uruguay', 'Paraguay']
WHERE role = 'hrbp';

-- manager_cl: Chile only
UPDATE public.gauss_user_roles
SET paises_acceso = ARRAY['Chile']
WHERE role = 'manager_cl';

-- hrbp_cl: Chile only
UPDATE public.gauss_user_roles
SET paises_acceso = ARRAY['Chile']
WHERE role = 'hrbp_cl';

-- Make paises_acceso NOT NULL
ALTER TABLE public.gauss_user_roles
ALTER COLUMN paises_acceso SET NOT NULL;

-- Add comment
COMMENT ON COLUMN public.gauss_user_roles.paises_acceso IS 'Array of countries the user has access to in Gauss module';