
CREATE TABLE IF NOT EXISTS public.tablero_espejo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablero_ninebox_id uuid NOT NULL REFERENCES public.tableros(id) ON DELETE CASCADE,
  tablero_gauss_id uuid NOT NULL REFERENCES public.tableros(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tablero_ninebox_id)
);

ALTER TABLE public.tablero_espejo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tablero_espejo_select" ON public.tablero_espejo;
CREATE POLICY "tablero_espejo_select"
ON public.tablero_espejo FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tablero_espejo_modify" ON public.tablero_espejo;
CREATE POLICY "tablero_espejo_modify"
ON public.tablero_espejo FOR ALL TO authenticated
USING (public.up_is_admin(auth.uid()))
WITH CHECK (public.up_is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.crear_tablero_gauss_espejo()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_gauss_id uuid;
BEGIN
  IF NEW.modulo_origen = 'ninebox' OR NEW.modulo_origen IS NULL THEN
    INSERT INTO public.tableros (nombre, equipo_id, empresa_id, modulo_origen, pais, created_at)
    VALUES (NEW.nombre, NEW.equipo_id, NEW.empresa_id, 'gauss', NEW.pais, now())
    RETURNING id INTO v_gauss_id;

    INSERT INTO public.tablero_espejo (tablero_ninebox_id, tablero_gauss_id)
    VALUES (NEW.id, v_gauss_id)
    ON CONFLICT (tablero_ninebox_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_crear_tablero_gauss_espejo ON public.tableros;
CREATE TRIGGER trigger_crear_tablero_gauss_espejo
  AFTER INSERT ON public.tableros
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_tablero_gauss_espejo();

-- Backfill espejos
INSERT INTO public.tableros (nombre, equipo_id, empresa_id, modulo_origen, pais, created_at)
SELECT t.nombre, t.equipo_id, t.empresa_id, 'gauss', t.pais, now()
FROM public.tableros t
WHERE (t.modulo_origen = 'ninebox' OR t.modulo_origen IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM public.tableros g
    WHERE g.modulo_origen = 'gauss'
      AND g.nombre = t.nombre
      AND g.equipo_id IS NOT DISTINCT FROM t.equipo_id
  );

INSERT INTO public.tablero_espejo (tablero_ninebox_id, tablero_gauss_id)
SELECT n.id, g.id
FROM public.tableros n
JOIN public.tableros g
  ON g.nombre = n.nombre
  AND g.equipo_id IS NOT DISTINCT FROM n.equipo_id
  AND g.modulo_origen = 'gauss'
WHERE (n.modulo_origen = 'ninebox' OR n.modulo_origen IS NULL)
ON CONFLICT (tablero_ninebox_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.sincronizar_empleados_a_gauss(p_tablero_ninebox_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tablero_gauss_id uuid;
BEGIN
  SELECT tablero_gauss_id INTO v_tablero_gauss_id
  FROM public.tablero_espejo
  WHERE tablero_ninebox_id = p_tablero_ninebox_id;

  IF v_tablero_gauss_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.calibracion_gauss (
    tablero_id, nombre_completo, empleado_email,
    competencia, familia_cargo,
    score_original, score_calibrado,
    pais, equipo, seniority, posicion, fecha_evaluacion
  )
  SELECT
    v_tablero_gauss_id,
    e.nombre,
    '',
    'Sin asignar',
    'Consultoría y Ejecución',
    GREATEST(1.0, LEAST(4.0, COALESCE(e.performance, 1.0))),
    GREATEST(1.0, LEAST(4.0, COALESCE(e.performance, 1.0))),
    COALESCE(emp.nombre, ''),
    COALESCE(eq.nombre, ''),
    'Sin asignar',
    'Sin asignar',
    CURRENT_DATE
  FROM public.empleados e
  JOIN public.tableros t ON t.id = e.tablero_id
  LEFT JOIN public.equipos eq ON eq.id = t.equipo_id
  LEFT JOIN public.empresas emp ON emp.id = COALESCE(eq.empresa_id, t.empresa_id)
  WHERE e.tablero_id = p_tablero_ninebox_id
    AND NOT EXISTS (
      SELECT 1 FROM public.calibracion_gauss cg
      WHERE cg.tablero_id = v_tablero_gauss_id
        AND cg.nombre_completo = e.nombre
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_sincronizar_empleado_gauss()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sincronizar_empleados_a_gauss(NEW.tablero_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_empleado_a_gauss ON public.empleados;
CREATE TRIGGER trigger_empleado_a_gauss
  AFTER INSERT ON public.empleados
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sincronizar_empleado_gauss();

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablero_ninebox_id FROM public.tablero_espejo LOOP
    PERFORM public.sincronizar_empleados_a_gauss(r.tablero_ninebox_id);
  END LOOP;
END $$;
