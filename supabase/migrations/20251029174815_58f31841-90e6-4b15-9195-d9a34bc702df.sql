-- Mover equipos de Uruguay a Paraguay (sin afectar configuración existente)

-- 1. Eliminar equipos de Uruguay
DELETE FROM public.equipos 
WHERE empresa_id = '4905856a-94e2-4106-b9c3-b93313c66828'
  AND nombre IN ('Gerencia', 'Operaciones Enterprise', 'Operaciones GB', 'Oficinas / Capital Humano');

-- 2. Crear los mismos equipos en Paraguay
INSERT INTO public.equipos (nombre, empresa_id) VALUES 
('Gerencia', 'af97777d-adab-48ff-824e-cd8842d0e21e'),
('Operaciones Enterprise', 'af97777d-adab-48ff-824e-cd8842d0e21e'),
('Operaciones GB', 'af97777d-adab-48ff-824e-cd8842d0e21e'),
('Oficinas / Capital Humano', 'af97777d-adab-48ff-824e-cd8842d0e21e')
ON CONFLICT DO NOTHING;