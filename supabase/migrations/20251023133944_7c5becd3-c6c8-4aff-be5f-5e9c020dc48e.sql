-- =====================================================
-- Asignar empresas a usuarios activos
-- =====================================================

-- Limpiar tabla empresas_usuarios de usuarios antiguos
DELETE FROM public.empresas_usuarios 
WHERE user_id NOT IN (
  '743686df-58bd-4129-b571-c21e9beff378',
  '7e653acd-b095-4d41-81ec-e9196016e963', 
  '45f2a400-8b30-4902-b35f-59fb5f97baaa',
  '04a354df-f7d2-48a3-ac45-c827ae2a446a'
);

-- Insertar asignaciones para los 4 usuarios en las 3 empresas
INSERT INTO public.empresas_usuarios (empresa_id, user_id, role)
VALUES
  -- maria.curci en las 3 empresas
  ('176a7c43-7e12-4616-a2a6-6b1c29be1a2b', '743686df-58bd-4129-b571-c21e9beff378', 'hrbp'),
  ('4905856a-94e2-4106-b9c3-b93313c66828', '743686df-58bd-4129-b571-c21e9beff378', 'hrbp'),
  ('af97777d-adab-48ff-824e-cd8842d0e21e', '743686df-58bd-4129-b571-c21e9beff378', 'hrbp'),
  -- mary.mundarain en las 3 empresas
  ('176a7c43-7e12-4616-a2a6-6b1c29be1a2b', '7e653acd-b095-4d41-81ec-e9196016e963', 'hrbp'),
  ('4905856a-94e2-4106-b9c3-b93313c66828', '7e653acd-b095-4d41-81ec-e9196016e963', 'hrbp'),
  ('af97777d-adab-48ff-824e-cd8842d0e21e', '7e653acd-b095-4d41-81ec-e9196016e963', 'hrbp'),
  -- agustinabelen.garcia en las 3 empresas
  ('176a7c43-7e12-4616-a2a6-6b1c29be1a2b', '45f2a400-8b30-4902-b35f-59fb5f97baaa', 'hrbp'),
  ('4905856a-94e2-4106-b9c3-b93313c66828', '45f2a400-8b30-4902-b35f-59fb5f97baaa', 'hrbp'),
  ('af97777d-adab-48ff-824e-cd8842d0e21e', '45f2a400-8b30-4902-b35f-59fb5f97baaa', 'hrbp'),
  -- tatiana.pina en las 3 empresas
  ('176a7c43-7e12-4616-a2a6-6b1c29be1a2b', '04a354df-f7d2-48a3-ac45-c827ae2a446a', 'manager'),
  ('4905856a-94e2-4106-b9c3-b93313c66828', '04a354df-f7d2-48a3-ac45-c827ae2a446a', 'manager'),
  ('af97777d-adab-48ff-824e-cd8842d0e21e', '04a354df-f7d2-48a3-ac45-c827ae2a446a', 'manager')
ON CONFLICT DO NOTHING;

-- Completar roles faltantes en tabla roles para tatiana.pina
INSERT INTO public.roles (user_id, empresa_id, role)
VALUES
  ('04a354df-f7d2-48a3-ac45-c827ae2a446a', '4905856a-94e2-4106-b9c3-b93313c66828', 'Manager'),
  ('04a354df-f7d2-48a3-ac45-c827ae2a446a', 'af97777d-adab-48ff-824e-cd8842d0e21e', 'Manager')
ON CONFLICT DO NOTHING;