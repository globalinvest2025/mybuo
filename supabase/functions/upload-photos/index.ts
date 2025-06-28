import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    );
  }

  try {
    console.log('Processing upload request...');
    
    // Parse form data
    const formData = await req.formData();
    
    // Get business ID and convert to number
    const businessIdString = formData.get('businessId') as string;
    const businessId = parseInt(businessIdString);
    
    // Get all photos
    const photos = formData.getAll('photos') as File[];

    console.log('Business ID:', businessId);
    console.log('Photos received:', photos.length);

    // Validate inputs
    if (!businessId || isNaN(businessId)) {
      return new Response(
        JSON.stringify({ error: 'businessId es requerido y debe ser un número válido.' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (photos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No se encontraron fotos para subir.' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Process and upload each photo to Storage
    const uploadPromises = photos.map(async (photo: File, index: number) => {
      console.log(`Processing photo ${index + 1}: ${photo.name}, size: ${photo.size} bytes`);
      
      // Convert File to ArrayBuffer, then to Uint8Array
      const arrayBuffer = await photo.arrayBuffer();
      const fileContent = new Uint8Array(arrayBuffer);
      
      // Create unique file path to avoid collisions
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileExtension = photo.name.split('.').pop() || 'jpg';
      const filePath = `${businessId}/${timestamp}_${index}_${randomSuffix}.${fileExtension}`;

      console.log(`Uploading file: ${filePath}, size: ${fileContent.length} bytes`);

      const uploadResult = await supabaseAdmin.storage
        .from('business-photos')
        .upload(filePath, fileContent, {
          contentType: photo.type || 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadResult.error) {
        console.error(`Upload error for ${filePath}:`, uploadResult.error);
        throw new Error(`Failed to upload ${photo.name}: ${uploadResult.error.message}`);
      }

      console.log(`Successfully uploaded: ${filePath}`);
      return uploadResult;
    });

    // Wait for all upload promises to resolve
    console.log('Waiting for all uploads to complete...');
    const uploadResults = await Promise.all(uploadPromises);

    console.log('All files uploaded successfully to Storage.');

    // Get uploaded file paths and prepare data for database insertion
    const photosToInsert = uploadResults.map((result, index) => {
      const path = result.data?.path;
      if (!path) {
        console.error(`No path found for upload result ${index}`);
        return null;
      }

      const { data } = supabaseAdmin.storage
        .from('business-photos')
        .getPublicUrl(path);

      return {
        business_id: businessId,
        url: data.publicUrl,
        order_index: index
      };
    }).filter(Boolean); // Filter out any null entries

    // Insert photo URLs into the database
    let dbInsertData = [];
    if (photosToInsert.length > 0) {
      console.log('Inserting photo URLs into database...');
      
      const { data, error: dbInsertError } = await supabaseAdmin
        .from('business_photos')
        .insert(photosToInsert)
        .select();

      if (dbInsertError) {
        console.error('Database insert error:', dbInsertError);
        throw new Error(`Error saving photos to database: ${dbInsertError.message}`);
      }
      
      dbInsertData = data || [];
      console.log('Photo URLs saved to database:', dbInsertData.length, 'records');
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Se procesaron ${photos.length} fotos correctamente.`,
        uploadedPaths: uploadResults.map(result => result.data?.path).filter(Boolean),
        publicUrls: photosToInsert.map(p => p?.url).filter(Boolean),
        businessId: businessId,
        dbRecords: dbInsertData
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({
        error: `Ha ocurrido un error inesperado: ${error.message}`,
        stack: error.stack
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});