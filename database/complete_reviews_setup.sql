-- =====================================================================
-- SETUP COMPLETO DE SISTEMA DE RESEÑAS PARA MYBUO
-- Ejecutar todo este código en el SQL Editor de Supabase
-- =====================================================================

-- Paso 1: Crear la tabla reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating smallint CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Restricción: un usuario solo puede revisar un negocio una vez
    UNIQUE (user_id, business_id)
);

-- Paso 2: Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Paso 3: Habilitar Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Paso 4: Crear políticas de seguridad
-- Política: Cualquiera puede leer reseñas (público)
CREATE POLICY "reviews_select_policy" ON public.reviews 
    FOR SELECT 
    USING (true);

-- Política: Solo usuarios autenticados pueden insertar sus propias reseñas
CREATE POLICY "reviews_insert_policy" ON public.reviews 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Política: Solo usuarios pueden actualizar sus propias reseñas
CREATE POLICY "reviews_update_policy" ON public.reviews 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Política: Solo usuarios pueden eliminar sus propias reseñas
CREATE POLICY "reviews_delete_policy" ON public.reviews 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Paso 5: Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 6: Trigger para ejecutar la función en cada UPDATE
DROP TRIGGER IF EXISTS reviews_updated_at_trigger ON public.reviews;
CREATE TRIGGER reviews_updated_at_trigger
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Paso 7: Verificar que todo esté correcto
-- Esto debería mostrar la estructura de la tabla
\d public.reviews

-- Paso 8: Insertar datos de prueba (OPCIONAL - solo para testing)
-- NOTA: Reemplaza los UUIDs con IDs reales de tu tabla businesses y users
/*
INSERT INTO public.reviews (business_id, user_id, rating, comment) VALUES 
(
    (SELECT id FROM public.businesses LIMIT 1),  -- Primer negocio
    auth.uid(),                                   -- Usuario actual (si estás logueado)
    5, 
    'Excelente servicio, muy recomendado!'
);
*/

-- =====================================================================
-- RESULTADO ESPERADO:
-- ✅ Tabla 'reviews' creada con todas las columnas necesarias
-- ✅ Índices creados para queries rápidas  
-- ✅ RLS habilitado con políticas de seguridad apropiadas
-- ✅ Triggers para mantener updated_at actualizado
-- ✅ Ready para usar con el sistema de reseñas!
-- =====================================================================