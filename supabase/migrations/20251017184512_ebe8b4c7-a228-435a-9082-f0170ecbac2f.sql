-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create empresas table
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Create equipos table
CREATE TABLE public.equipos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;

-- Create tableros table
CREATE TABLE public.tableros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  equipo_id UUID REFERENCES public.equipos(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tableros ENABLE ROW LEVEL SECURITY;

-- Create evaluaciones table with NUMERIC scores
CREATE TABLE public.evaluaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  persona_nombre TEXT NOT NULL,
  potencial_score NUMERIC(3,1) NOT NULL,
  desempeno_score NUMERIC(3,1) NOT NULL,
  equipo_id UUID REFERENCES public.equipos(id) ON DELETE CASCADE NOT NULL,
  tablero_id UUID REFERENCES public.tableros(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;

-- Create validation trigger for scores instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_evaluacion_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
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

CREATE TRIGGER validate_evaluacion_scores_trigger
BEFORE INSERT OR UPDATE ON public.evaluaciones
FOR EACH ROW
EXECUTE FUNCTION public.validate_evaluacion_scores();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for empresas (managers can view all)
CREATE POLICY "Managers can view empresas"
ON public.empresas
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can insert empresas"
ON public.empresas
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for equipos (managers only see their teams)
CREATE POLICY "Managers can view their equipos"
ON public.equipos
FOR SELECT
TO authenticated
USING (
  auth.uid() = manager_id 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Managers can insert their equipos"
ON public.equipos
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = manager_id 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Managers can update their equipos"
ON public.equipos
FOR UPDATE
TO authenticated
USING (
  auth.uid() = manager_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for tableros (managers only see tableros from their teams)
CREATE POLICY "Managers can view their tableros"
ON public.tableros
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.equipos
    WHERE equipos.id = tableros.equipo_id
    AND (equipos.manager_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Managers can insert tableros for their teams"
ON public.tableros
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.equipos
    WHERE equipos.id = equipo_id
    AND (equipos.manager_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- RLS Policies for evaluaciones (managers only see evaluaciones from their teams)
CREATE POLICY "Managers can view their evaluaciones"
ON public.evaluaciones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.equipos
    WHERE equipos.id = evaluaciones.equipo_id
    AND (equipos.manager_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Managers can insert evaluaciones for their teams"
ON public.evaluaciones
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.equipos
    WHERE equipos.id = equipo_id
    AND (equipos.manager_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Managers can update evaluaciones for their teams"
ON public.evaluaciones
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.equipos
    WHERE equipos.id = evaluaciones.equipo_id
    AND (equipos.manager_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Managers can delete evaluaciones for their teams"
ON public.evaluaciones
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.equipos
    WHERE equipos.id = evaluaciones.equipo_id
    AND (equipos.manager_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Trigger to assign 'manager' role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Enable real-time for evaluaciones
ALTER TABLE public.evaluaciones REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluaciones;