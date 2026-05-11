
-- talent_plans
CREATE TABLE public.talent_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id uuid NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  tablero_id uuid NOT NULL REFERENCES public.tableros(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('desarrollo', 'riesgo')),
  notas text,
  plan_carrera text,
  mentor text,
  proyectos_clave text,
  pip_objetivo text,
  pip_fecha_inicio date,
  pip_fecha_fin date,
  pip_estado text CHECK (pip_estado IN ('pendiente', 'en_curso', 'completado', 'cancelado')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empleado_id, tablero_id)
);

ALTER TABLE public.talent_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "talent_plans_select_authenticated" ON public.talent_plans
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "talent_plans_insert_authenticated" ON public.talent_plans
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "talent_plans_update_authenticated" ON public.talent_plans
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "talent_plans_delete_authenticated" ON public.talent_plans
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_talent_plans_updated_at
  BEFORE UPDATE ON public.talent_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- talent_acciones
CREATE TABLE public.talent_acciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.talent_plans(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  fecha_limite date,
  responsable text,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'completado')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.talent_acciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "talent_acciones_select_authenticated" ON public.talent_acciones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "talent_acciones_insert_authenticated" ON public.talent_acciones
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "talent_acciones_update_authenticated" ON public.talent_acciones
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "talent_acciones_delete_authenticated" ON public.talent_acciones
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_talent_acciones_updated_at
  BEFORE UPDATE ON public.talent_acciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- talent_notas
CREATE TABLE public.talent_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.talent_plans(id) ON DELETE CASCADE,
  contenido text NOT NULL,
  autor_email text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.talent_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "talent_notas_select_authenticated" ON public.talent_notas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "talent_notas_insert_authenticated" ON public.talent_notas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "talent_notas_update_authenticated" ON public.talent_notas
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "talent_notas_delete_authenticated" ON public.talent_notas
  FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_talent_plans_tablero ON public.talent_plans(tablero_id);
CREATE INDEX idx_talent_plans_empleado ON public.talent_plans(empleado_id);
CREATE INDEX idx_talent_acciones_plan ON public.talent_acciones(plan_id);
CREATE INDEX idx_talent_notas_plan ON public.talent_notas(plan_id);
