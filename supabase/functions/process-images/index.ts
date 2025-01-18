import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // Get the raw body text
    const bodyText = await req.text();
    
    // Try to parse the body
    let body;
    try {
      body = bodyText ? JSON.parse(bodyText) : null;
    } catch (parseError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Missing request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check for authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No valid authentication token provided' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract JWT token
    const jwt = authHeader.split(' ')[1]
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the JWT token using the anon key for auth
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '')
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(jwt)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { image1: personImage, image2: garmentImage } = body

    if (!personImage || !garmentImage) {
      return new Response(
        JSON.stringify({ error: 'Both image URLs are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get API key from environment variable
    const apiKey = Deno.env.get('PIXELCUT_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Pixelcut API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Call Pixelcut API
    try {
      const pixelcutResponse = await fetch('https://api.developer.pixelcut.ai/v1/try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify({
          person_image_url: personImage,
          garment_image_url: garmentImage
        })
      });

      if (!pixelcutResponse.ok) {
        const errorData = await pixelcutResponse.json().catch(() => ({}));
        throw new Error(`Pixelcut API error: ${errorData.error || pixelcutResponse.statusText}`);
      }

      const pixelcutData = await pixelcutResponse.json();
      const resultImage = pixelcutData.result_url;

      if (!resultImage) {
        throw new Error('No result image URL received from Pixelcut API');
      }

      // Download the result image
      const imageResponse = await fetch(resultImage);
      if (!imageResponse.ok) {
        throw new Error('Failed to download result image');
      }

      const imageBlob = await imageResponse.blob();
      const fileName = `results/${user.id}/${Date.now()}.jpg`;

      // Upload to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('clothes')
        .upload(fileName, imageBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload result image: ${uploadError.message}`);
      }

      // Get the public URL of the uploaded image
      const { data: { publicUrl: storedResultImage } } = supabase.storage
        .from('clothes')
        .getPublicUrl(fileName);

      // Store paths in database
      const { error: insertError } = await supabase
        .from('outfits')
        .insert({
          user_id: user.id,
          man_image_path: personImage,
          cloth_image_path: garmentImage,
          result_image_path: storedResultImage
        })

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to save outfit: ${insertError.message}`)
      }

      return new Response(
        JSON.stringify({
          resultImage: storedResultImage,
          message: 'Images processed and saved successfully'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (apiError) {
      console.error('Pixelcut API error:', apiError);
      return new Response(
        JSON.stringify({ 
          error: apiError instanceof Error ? apiError.message : 'Failed to process images'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 