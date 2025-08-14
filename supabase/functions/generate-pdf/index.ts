import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple PDF content creator (creates a text-based PDF)
function createSimplePDF(htmlContent: string, documentType: string, documentId: string): string {
  // Extract title from HTML
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : `${documentType.toUpperCase()} Document`;
  
  // Extract text content (simplified)
  const bodyMatch = htmlContent.match(/<body[^>]*>(.*?)<\/body>/is);
  const bodyContent = bodyMatch ? bodyMatch[1] : htmlContent;
  
  // Remove script and style tags
  const cleanContent = bodyContent
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Create a simple PDF structure (basic PDF format)
  const pdfHeader = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${cleanContent.length + 200}
>>
stream
BT
/F1 12 Tf
50 750 Td
(${title}) Tj
0 -30 Td
(Document ID: ${documentId}) Tj
0 -30 Td
(${cleanContent.substring(0, 1000)}...) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000274 00000 n 
0000000${(400 + cleanContent.length).toString().padStart(6, '0')} 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${450 + cleanContent.length}
%%EOF`;

  return pdfHeader;
}

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

    // Try using a more reliable external PDF service with proper error handling
    let pdfBuffer: ArrayBuffer | null = null;
    
    try {
      // Try PDF24 API (free tier available)
      const pdf24Response = await fetch('https://pdf24.org/api/pdf/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: publicUrl,
          format: 'A4',
          margin: {
            top: '20mm',
            bottom: '20mm',
            left: '15mm',
            right: '15mm'
          },
          printBackground: true
        })
      });

      if (pdf24Response.ok) {
        pdfBuffer = await pdf24Response.arrayBuffer();
      }
    } catch (error) {
      console.error('PDF24 failed:', error);
    }

    // Fallback: Try PDFShift (if PDF24 fails)
    if (!pdfBuffer) {
      try {
        const pdfShiftResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: publicUrl,
            format: 'A4',
            margin: '20mm 15mm',
            print_background: true,
            wait_until: 'load'
          })
        });

        if (pdfShiftResponse.ok) {
          pdfBuffer = await pdfShiftResponse.arrayBuffer();
        }
      } catch (error) {
        console.error('PDFShift failed:', error);
      }
    }

    // Final fallback: Create simple text-based PDF
    if (!pdfBuffer) {
      console.log('Using fallback PDF generation');
      const htmlResponse = await fetch(publicUrl);
      const htmlContent = await htmlResponse.text();
      const pdfContent = createSimplePDF(htmlContent, documentType, documentId);
      pdfBuffer = new TextEncoder().encode(pdfContent).buffer;
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