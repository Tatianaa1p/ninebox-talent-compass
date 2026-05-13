-- 1. Agregar columna periodo
ALTER TABLE public.tableros 
ADD COLUMN IF NOT EXISTS periodo integer DEFAULT 2026;

-- 2. Poblar tableros existentes
UPDATE public.tableros SET periodo = 2026 WHERE periodo IS NULL;

-- 3. NOT NULL
ALTER TABLE public.tableros 
ALTER COLUMN periodo SET NOT NULL;

-- 4. Índice
CREATE INDEX IF NOT EXISTS idx_tableros_periodo 
ON public.tableros(periodo);

-- 5. Actualizar trigger de espejo Gauss para heredar periodo
CREATE OR REPLACE FUNCTION public.crear_tablero_gauss_espejo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_gauss_id uuid;
BEGIN
  IF NEW.modulo_origen = 'ninebox' OR NEW.modulo_origen IS NULL THEN
    INSERT INTO public.tableros (nombre, equipo_id, empresa_id, modulo_origen, pais, periodo, created_at)
    VALUES (NEW.nombre, NEW.equipo_id, NEW.empresa_id, 'gauss', NEW.pais, COALESCE(NEW.periodo, 2026), now())
    RETURNING id INTO v_gauss_id;

    INSERT INTO public.tablero_espejo (tablero_ninebox_id, tablero_gauss_id)
    VALUES (NEW.id, v_gauss_id)
    ON CONFLICT (tablero_ninebox_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;