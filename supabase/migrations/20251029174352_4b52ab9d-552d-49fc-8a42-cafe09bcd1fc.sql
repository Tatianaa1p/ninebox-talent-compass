-- Crear equipos en la empresa Uruguay (sin afectar configuración existente)
INSERT INTO public.equipos (nombre, empresa_id) VALUES 
('Gerencia', '4905856a-94e2-4106-b9c3-b93313c66828'),
('Operaciones Enterprise', '4905856a-94e2-4106-b9c3-b93313c66828'),
('Operaciones GB', '4905856a-94e2-4106-b9c3-b93313c66828'),
('Oficinas / Capital Humano', '4905856a-94e2-4106-b9c3-b93313c66828')
ON CONFLICT DO NOTHING;