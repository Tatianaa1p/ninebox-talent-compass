-- Agrega columna email si no existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- GUARDA EL EMAIL DE TATIANA CON SU UUID REAL
UPDATE public.profiles 
SET email = 'tatiana.pina@seidor.com' 
WHERE id = '04a354df-f7d2-48a3-ac45-c827ae2a446a';