-- Agregar campo tablero_id a calibracion_gauss para asociar calibraciones a tableros
ALTER TABLE public.calibracion_gauss 
ADD COLUMN tablero_id uuid REFERENCES public.tableros(id) ON DELETE SET NULL;

-- Crear índice para mejorar búsquedas por tablero
CREATE INDEX idx_calibracion_gauss_tablero ON public.calibracion_gauss(tablero_id);

-- Agregar columna nombre_completo para cuando no haya email
ALTER TABLE public.calibracion_gauss 
ADD COLUMN nombre_completo text;

COMMENT ON COLUMN public.calibracion_gauss.tablero_id IS 'Tablero al que pertenece esta calibración';
COMMENT ON COLUMN public.calibracion_gauss.nombre_completo IS 'Nombre completo del empleado cuando no hay email disponible';