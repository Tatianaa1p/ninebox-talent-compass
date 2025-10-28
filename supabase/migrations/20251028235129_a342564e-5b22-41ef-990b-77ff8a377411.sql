-- Add original score columns to evaluaciones table to store snapshot before calibration
ALTER TABLE public.evaluaciones 
  ADD COLUMN IF NOT EXISTS potencial_score_original numeric,
  ADD COLUMN IF NOT EXISTS desempeno_score_original numeric;