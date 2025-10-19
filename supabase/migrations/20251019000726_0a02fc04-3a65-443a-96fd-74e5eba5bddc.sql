-- Vincular usuarios HRBP con la empresa SEIDOR South LATAM
INSERT INTO public.empresas_usuarios (empresa_id, user_id, role)
VALUES 
  ('176a7c43-7e12-4616-a2a6-6b1c29be1a2b', 'd17f680d-207a-4ab9-8313-d28025aa4488', 'hrbp'),
  ('176a7c43-7e12-4616-a2a6-6b1c29be1a2b', 'def00d38-f0bc-4345-8dbb-f25b5932a1b7', 'hrbp'),
  ('176a7c43-7e12-4616-a2a6-6b1c29be1a2b', 'dcb7e315-4ee0-486f-8407-96a3273401e6', 'hrbp'),
  ('176a7c43-7e12-4616-a2a6-6b1c29be1a2b', '1c089517-0d7c-4aed-ae48-d74fc240876b', 'hrbp')
ON CONFLICT (empresa_id, user_id) DO NOTHING;