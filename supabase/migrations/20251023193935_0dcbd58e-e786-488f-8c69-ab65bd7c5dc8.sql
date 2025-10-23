-- Drop existing table and recreate with correct structure
DROP TABLE IF EXISTS public.calibraciones CASCADE;

CREATE TABLE public.calibraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id UUID NOT NULL UNIQUE REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  cuadrante_original TEXT NOT NULL,
  cuadrante_calibrado TEXT NOT NULL,
  score_original_potencial NUMERIC NOT NULL,
  score_calibrado_potencial NUMERIC NOT NULL,
  score_original_desempeno NUMERIC NOT NULL,
  score_calibrado_desempeno NUMERIC NOT NULL,
  manager_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calibraciones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "HRBP Managers calibrar" 
ON public.calibraciones
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = auth.uid()
    AND role IN ('hrbp', 'manager')
    AND (permisos_globales->>'calibrar_ninebox')::boolean = true
  )
);

CREATE POLICY "HRBP Managers ver" 
ON public.calibraciones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = auth.uid()
    AND role IN ('hrbp', 'manager')
  )
);