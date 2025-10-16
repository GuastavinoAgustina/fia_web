-- SQL para verificar la estructura de la tabla Piloto en Supabase
-- Las columnas deberían ser: id_piloto, nombre, fecha_nacimiento, activo, país, foto

-- Verificar que todas las columnas necesarias existan
-- Si alguna no existe, agrégala manualmente en Supabase

-- Verificar las columnas existentes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Piloto'
ORDER BY ordinal_position;