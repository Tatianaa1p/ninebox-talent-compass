-- Agregar ON DELETE CASCADE a las foreign keys de tableros

-- 1. Tabla empleados
ALTER TABLE public.empleados
DROP CONSTRAINT IF EXISTS empleados_tablero_id_fkey;

ALTER TABLE public.empleados
ADD CONSTRAINT empleados_tablero_id_fkey
FOREIGN KEY (tablero_id) REFERENCES public.tableros(id)
ON DELETE CASCADE;

-- 2. Tabla calibraciones
ALTER TABLE public.calibraciones
DROP CONSTRAINT IF EXISTS calibraciones_tablero_id_fkey;

ALTER TABLE public.calibraciones
ADD CONSTRAINT calibraciones_tablero_id_fkey
FOREIGN KEY (tablero_id) REFERENCES public.tableros(id)
ON DELETE CASCADE;

-- 3. Tabla evaluaciones
ALTER TABLE public.evaluaciones
DROP CONSTRAINT IF EXISTS evaluaciones_tablero_id_fkey;

ALTER TABLE public.evaluaciones
ADD CONSTRAINT evaluaciones_tablero_id_fkey
FOREIGN KEY (tablero_id) REFERENCES public.tableros(id)
ON DELETE CASCADE;

-- 4. Tabla calibracion_gauss
ALTER TABLE public.calibracion_gauss
DROP CONSTRAINT IF EXISTS calibracion_gauss_tablero_id_fkey;

ALTER TABLE public.calibracion_gauss
ADD CONSTRAINT calibracion_gauss_tablero_id_fkey
FOREIGN KEY (tablero_id) REFERENCES public.tableros(id)
ON DELETE CASCADE;