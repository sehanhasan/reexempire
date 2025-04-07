
// This edge function generates WhatsApp message links for staff notifications
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Set up CORS headers for browser requests
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
    // Parse the request body
    const { appointment, staffs } = await req.json();
    
    // Validate required data
    if (!appointment) {
      return new Response(
        JSON.stringify({ error: "Missing required appointment data" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Format the appointment date and times
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString();
    const staffList = staffs && staffs.length > 0 
      ? `\nAssigned staff: ${staffs.map(staff => staff.name).join(', ')}`
      : "\nNo staff assigned";
    
    // Compose the WhatsApp message
    const message = `
📅 *Appointment Details*
Title: ${appointment.title}
Date: ${appointmentDate}
Time: ${appointment.start_time} - ${appointment.end_time}
Status: ${appointment.status}${staffList}

Location: ${appointment.location || 'Not specified'}

${appointment.notes ? `\nNotes: ${appointment.notes}` : ''}
    `.trim();
    
    // Generate WhatsApp share URL
    // Replace spaces with %20 and new lines with %0A for proper URL encoding
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    // Return the WhatsApp URL
    return new Response(
      JSON.stringify({ 
        success: true, 
        whatsappUrl: whatsappUrl
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error generating WhatsApp share link:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to generate WhatsApp share link" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
