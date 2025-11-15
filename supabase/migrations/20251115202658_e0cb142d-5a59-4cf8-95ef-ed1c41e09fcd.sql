-- Crear índices para optimizar consultas en calibracion_gauss
-- Estos índices acelerarán significativamente las búsquedas por país, tablero y equipo

CREATE INDEX IF NOT EXISTS idx_calibracion_gauss_pais 
ON calibracion_gauss(pais);

CREATE INDEX IF NOT EXISTS idx_calibracion_gauss_tablero_id 
ON calibracion_gauss(tablero_id);

CREATE INDEX IF NOT EXISTS idx_calibracion_gauss_equipo 
ON calibracion_gauss(equipo);

CREATE INDEX IF NOT EXISTS idx_calibracion_gauss_pais_tablero 
ON calibracion_gauss(pais, tablero_id);

-- Índice compuesto para mejorar filtros combinados
CREATE INDEX IF NOT EXISTS idx_calibracion_gauss_filters 
ON calibracion_gauss(pais, tablero_id, equipo, familia_cargo);