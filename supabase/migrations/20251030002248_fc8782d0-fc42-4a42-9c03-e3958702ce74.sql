
-- Crear equipos en la empresa Chile
-- Inserta los equipos solo si no existen (verificando con WHERE NOT EXISTS)

DO $$
DECLARE
  v_empresa_id UUID;
BEGIN
  -- Obtener ID de la empresa Chile
  SELECT id INTO v_empresa_id FROM public.empresas WHERE nombre = 'Chile';
  
  -- Crear equipos verificando que no existan
  INSERT INTO public.equipos (nombre, empresa_id)
  SELECT nombre, v_empresa_id
  FROM (VALUES
    ('EC_Contabilidad'),
    ('EC_Facturación'),
    ('EC_Gerencia de Administración y Finanzas'),
    ('EC_C01_Soporte Celula A'),
    ('EC_C01_Soporte Celula B'),
    ('EC_C01_Soporte Celula C'),
    ('EC_C01_Soporte Celula D'),
    ('EC_C01_Soporte Celula E'),
    ('EC_C01_Soporte Celula F'),
    ('EC_C01_Soporte Equipo Go'),
    ('EC_C01_Soporte Equipo Incidentes'),
    ('EC_C01_Líderes AMS'),
    ('EC_C01_Soporte Equipo Desarrollo/Integraciones'),
    ('EC_C01_Soporte Equipo N1'),
    ('EC_C01_Soporte Equipo Seguridad'),
    ('EC_Gerentes Operaciones BO'),
    ('EC_C36_Gerencia de Proyectos 1 BO'),
    ('EC_C37_Gerencia de Proyectos 2 BO'),
    ('EC_C38_Base Instalada Business One'),
    ('EC_C38_Desarrollo de Productos Business One'),
    ('EC_C40_AWS BO'),
    ('EC_C41_Mesa de Soporte Business One'),
    ('EC_C44_Infraestructura Business One'),
    ('EC_Gerencia Comercial Corporate C0'),
    ('EC_Gerencia Comercial General Business'),
    ('EC_Gerencia de Consultoría Estratégica'),
    ('EC_Reportes N1'),
    ('EC_Marketing y Generación de Demanda'),
    ('EC_Consultoría SAP Ariba C33'),
    ('EC_Gerentes consultoría división Operaciones SAP'),
    ('EC_Operaciones SAP C10'),
    ('EC_Operaciones SAP C13'),
    ('EC_Operaciones SAP C5'),
    ('EC_Operaciones SAP C6'),
    ('EC_Operaciones SAP C9'),
    ('EC_Personas'),
    ('EC_STAFF'),
    ('EC_Gerencia Tech'),
    ('EC_Consultoría Basis'),
    ('EC_Reclutamiento y Selección'),
    ('EC_Staffing 1'),
    ('EC_Staffing 2')
  ) AS nuevos_equipos(nombre)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.equipos
    WHERE equipos.nombre = nuevos_equipos.nombre
      AND equipos.empresa_id = v_empresa_id
  );
  
END $$;
