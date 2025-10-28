-- Create unique index for calibraciones to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_calibracion_unica 
ON calibraciones (empleado_id, tablero_id);

-- Add comment for clarity
COMMENT ON INDEX idx_calibracion_unica IS 'Ensures each employee has only one calibration per board';