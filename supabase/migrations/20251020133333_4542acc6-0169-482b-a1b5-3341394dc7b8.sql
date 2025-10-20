-- Create calibraciones table for tracking calibration history
CREATE TABLE IF NOT EXISTS public.calibraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id UUID REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  cuadrante_original TEXT NOT NULL,
  cuadrante_calibrado TEXT NOT NULL,
  score_original_potencial NUMERIC NOT NULL,
  score_calibrado_potencial NUMERIC NOT NULL,
  score_original_desempeno NUMERIC NOT NULL,
  score_calibrado_desempeno NUMERIC NOT NULL,
  manager_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.calibraciones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "HRBP can insert calibraciones"
ON public.calibraciones
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "HRBP can view all calibraciones"
ON public.calibraciones
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'hrbp'::app_role));

CREATE POLICY "Anonymous users can insert calibraciones (demo mode)"
ON public.calibraciones
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anonymous users can view calibraciones (demo mode)"
ON public.calibraciones
FOR SELECT
TO anon
USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calibraciones_evaluacion ON public.calibraciones(evaluacion_id);
CREATE INDEX IF NOT EXISTS idx_calibraciones_manager ON public.calibraciones(manager_id);
CREATE INDEX IF NOT EXISTS idx_calibraciones_created ON public.calibraciones(created_at DESC);