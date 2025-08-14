import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { publicUrl, documentId, documentType } = await req.json();
    
    if (!publicUrl || !documentId || !documentType) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: publicUrl, documentId, documentType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating PDF for:', { publicUrl, documentId, documentType });

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, test if URL is accessible
    try {
      const testResponse = await fetch(publicUrl, { method: 'HEAD' });
      console.log('URL accessibility test:', testResponse.status, testResponse.statusText);
    } catch (error) {
      console.error('URL test failed:', error);
    }

    // Use PDFShift.io - reliable service for PDF generation
    let pdfBuffer: ArrayBuffer;
    
    try {
      console.log('Attempting PDF generation with htmlcsstoimage.com...');
      
      const response = await fetch('https://hcti.io/v1/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('demo:demo') // Using demo credentials
        },
        body: JSON.stringify({
          url: publicUrl,
          format: 'pdf',
          device_scale: 1,
          viewport_width: 1200,
          viewport_height: 800,
          print_options: {
            format: 'A4',
            margin: {
              top: '20mm',
              bottom: '20mm',
              left: '15mm',
              right: '15mm'
            },
            print_background: true
          }
        })
      });

      if (!response.ok) {
        console.error('HCTI response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('HCTI error details:', errorText);
        throw new Error(`HCTI failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('HCTI result:', result);
      
      if (result.url) {
        // Download the generated PDF
        const pdfResponse = await fetch(result.url);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to download PDF: ${pdfResponse.status}`);
        }
        pdfBuffer = await pdfResponse.arrayBuffer();
      } else {
        throw new Error('No PDF URL returned from HCTI');
      }
      
    } catch (error) {
      console.error('HCTI PDF generation failed:', error);
      
      // Fallback to Puppeteer-as-a-Service
      try {
        console.log('Trying fallback with Puppeteer-as-a-Service...');
        
        const puppeteerResponse = await fetch('https://api.puppeteer.dev/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: publicUrl,
            options: {
              format: 'A4',
              margin: {
                top: '20mm',
                bottom: '20mm',
                left: '15mm',
                right: '15mm'
              },
              printBackground: true,
              waitUntil: 'networkidle0',
              timeout: 30000
            }
          })
        });

        if (!puppeteerResponse.ok) {
          throw new Error(`Puppeteer service failed: ${puppeteerResponse.status} ${puppeteerResponse.statusText}`);
        }

        pdfBuffer = await puppeteerResponse.arrayBuffer();
        console.log('PDF generated successfully with Puppeteer service');
        
      } catch (puppeteerError) {
        console.error('Puppeteer service also failed:', puppeteerError);
        throw new Error(`All PDF generation services failed. Original error: ${error.message}, Puppeteer error: ${puppeteerError.message}`);
      }
    }

    // Convert to Uint8Array for Supabase storage
    const pdfData = new Uint8Array(pdfBuffer);
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${documentType}-${documentId}-${timestamp}.pdf`;
    
    // Upload PDF to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(filename, pdfData, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get public URL of the uploaded PDF
    const { data: publicUrlData } = supabase.storage
      .from('pdfs')
      .getPublicUrl(filename);

    console.log('PDF generated and uploaded successfully:', publicUrlData.publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl: publicUrlData.publicUrl,
        filename: filename
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});