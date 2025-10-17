-- Fix function search path for validate_evaluacion_scores
CREATE OR REPLACE FUNCTION public.validate_evaluacion_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.potencial_score < 1 OR NEW.potencial_score > 5 THEN
    RAISE EXCEPTION 'potencial_score must be between 1 and 5';
  END IF;
  
  IF NEW.desempeno_score < 1 OR NEW.desempeno_score > 5 THEN
    RAISE EXCEPTION 'desempeno_score must be between 1 and 5';
  END IF;
  
  RETURN NEW;
END;
$$;