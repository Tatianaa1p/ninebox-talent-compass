
-- Agregar Chile al array empresas_acceso de Tatiana Piña
-- Solo actualiza si Chile no está ya en el array

UPDATE public.user_permissions
SET empresas_acceso = array_append(empresas_acceso, 'Chile'),
    updated_at = now()
WHERE user_id = '04a354df-f7d2-48a3-ac45-c827ae2a446a'
  AND NOT ('Chile' = ANY(empresas_acceso));
