-- CRITICAL FIX: Enable RLS on calibraciones table
-- This was blocking all calibration saves

ALTER TABLE public.calibraciones ENABLE ROW LEVEL SECURITY;

-- Existing policies will now be enforced:
-- ✅ "HRBP Managers calibrar" (ALL) - allows INSERT/UPDATE/DELETE for users with calibrar_ninebox permission
-- ✅ "HRBP Managers ver" (SELECT) - allows SELECT for hrbp/manager roles