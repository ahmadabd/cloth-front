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
    // Log request details
    console.log('Request method:', req.method);
    console.log('Content-Type:', req.headers.get('content-type'));
    console.log('Authorization:', req.headers.get('authorization')?.substring(0, 20) + '...');
    
    // Get the raw body text
    const bodyText = await req.text();
    console.log('Raw request body:', bodyText);
    
    // Try to parse the body
    let body;
    try {
      body = bodyText ? JSON.parse(bodyText) : null;
      console.log('Parsed body:', body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message,
          receivedBody: bodyText
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!body) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing request body',
          receivedBody: bodyText
        }),
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
    const { image1: manImage, image2: clothImage } = body

    if (!manImage || !clothImage) {
      return new Response(
        JSON.stringify({ 
          error: 'Both image URLs are required',
          receivedBody: body
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Processing images:', { manImage, clothImage });

    // Mock processing - in real implementation, process images here
    const mockResultPath = 'mock-result.jpg'
    const resultImage = 'https://xbjehtrzxkycliualili.supabase.co/storage/v1/object/public/clothes/mock-result.jpg'

    // Store paths in database
    const { error: insertError } = await supabase
      .from('outfits')
      .insert({
        user_id: user.id,
        man_image_path: manImage,
        cloth_image_path: clothImage,
        result_image_path: resultImage
      })

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error(`Failed to save outfit: ${insertError.message}`)
    }

    const response = {
      resultImage,
      message: 'Images processed and saved successfully',
      user_id: user.id
    }

    console.log('Sending response:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 