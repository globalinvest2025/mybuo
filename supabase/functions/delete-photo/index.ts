// supabase/functions/delete-photo/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
}

serve(async (req) => {
  // Manejar preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Solo permitir método DELETE
  if (req.method !== 'DELETE') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Obtener datos del request
    const { photoId, storagePath } = await req.json()
    
    console.log('🗑️ Delete request received:', { photoId, storagePath })

    if (!photoId || !storagePath) {
      throw new Error('photoId and storagePath are required')
    }

    // Crear cliente de Supabase con SERVICE_ROLE_KEY para bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verificar que la foto existe y obtener información adicional
    const { data: photoData, error: fetchError } = await supabase
      .from('business_photos')
      .select('*, businesses!inner(user_id)')
      .eq('id', photoId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching photo:', fetchError)
      throw new Error(`Photo not found: ${fetchError.message}`)
    }

    console.log('📋 Photo data found:', photoData)

    // 2. Verificar autorización (opcional - puedes omitir si confías en RLS policies)
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (user && photoData.businesses.user_id !== user.id) {
        throw new Error('Unauthorized: You can only delete your own photos')
      }
    }

    // 3. Eliminar archivo del storage
    console.log('💾 Deleting from storage:', storagePath)
    const { data: storageData, error: storageError } = await supabase.storage
      .from('business-photos')
      .remove([storagePath])

    if (storageError) {
      console.error('❌ Storage deletion error:', storageError)
      throw new Error(`Storage deletion failed: ${storageError.message}`)
    }

    console.log('✅ Storage deletion successful:', storageData)

    // 4. Eliminar registro de la base de datos
    console.log('📋 Deleting from database:', photoId)
    const { error: dbError } = await supabase
      .from('business_photos')
      .delete()
      .eq('id', photoId)

    if (dbError) {
      console.error('❌ Database deletion error:', dbError)
      throw new Error(`Database deletion failed: ${dbError.message}`)
    }

    console.log('✅ Database deletion successful')

    // 5. Respuesta exitosa
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Photo deleted successfully',
        deletedPhotoId: photoId,
        deletedStoragePath: storagePath
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Delete photo error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }), 
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
