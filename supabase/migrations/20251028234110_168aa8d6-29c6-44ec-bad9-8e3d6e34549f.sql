-- Change calibraciones score columns from integer to numeric to support decimal values
ALTER TABLE public.calibraciones 
  ALTER COLUMN performance_score TYPE numeric USING performance_score::numeric,
  ALTER COLUMN potential_score TYPE numeric USING potential_score::numeric;