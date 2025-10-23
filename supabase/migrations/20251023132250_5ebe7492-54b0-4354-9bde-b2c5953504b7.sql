-- =====================================================
-- CRITICAL FIX: Enable RLS on all public tables
-- =====================================================
-- These tables have policies but RLS was never enabled

ALTER TABLE public.calibraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tableros ENABLE ROW LEVEL SECURITY;

-- Note: empresas_usuarios, user_roles, and roles already have RLS enabled