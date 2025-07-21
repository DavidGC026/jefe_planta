-- Migration script to add pass_status and trap_incorrect_count fields
-- This handles existing rows by setting default values

USE resultados;

-- Add pass_status column if it doesn't exist
-- For existing rows, default to 'REPROBADO'
ALTER TABLE evaluaciones_personal 
ADD COLUMN pass_status ENUM('APROBADO', 'REPROBADO') DEFAULT 'REPROBADO' AFTER total_obtenido;

-- Add trap_incorrect_count column if it doesn't exist
-- For existing rows, default to 0 trap errors
ALTER TABLE evaluaciones_personal 
ADD COLUMN trap_incorrect_count INT DEFAULT 0 AFTER pass_status;

-- Update existing rows to have default values if they are NULL
UPDATE evaluaciones_personal 
SET pass_status = 'REPROBADO' 
WHERE pass_status IS NULL;

UPDATE evaluaciones_personal 
SET trap_incorrect_count = 0 
WHERE trap_incorrect_count IS NULL;

-- Verify the migration
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN pass_status = 'REPROBADO' THEN 1 END) as reprobado_count,
    COUNT(CASE WHEN trap_incorrect_count = 0 THEN 1 END) as zero_traps_count
FROM evaluaciones_personal;

SELECT 'Migration completed successfully. Existing rows defaulted to REPROBADO status and 0 trap errors.' as status;
