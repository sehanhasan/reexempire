
// This edge function sends WhatsApp notifications when appointments are created or updated
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { twilio } from "npm:twilio@4.19.0";

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
    // Get environment variables
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    // Check if Twilio credentials are configured
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error("Twilio credentials not configured");
      return new Response(
        JSON.stringify({ 
          error: "Twilio credentials not configured" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Parse the request body
    const { appointment, staffs, recipientPhone } = await req.json();
    
    // Validate required data
    if (!appointment || !recipientPhone) {
      return new Response(
        JSON.stringify({ error: "Missing required data" }),
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
📅 *Appointment Confirmation*
Title: ${appointment.title}
Date: ${appointmentDate}
Time: ${appointment.start_time} - ${appointment.end_time}
Status: ${appointment.status}${staffList}

Location: ${appointment.location || 'Not specified'}

${appointment.notes ? `\nNotes: ${appointment.notes}` : ''}
    `.trim();
    
    // Initialize Twilio client
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    // Format the phone number (ensure it starts with +)
    const formattedPhone = recipientPhone.startsWith('+') 
      ? recipientPhone 
      : `+${recipientPhone}`;
    
    console.log(`Sending WhatsApp message to ${formattedPhone}`);
    
    // Send the WhatsApp message using Twilio
    const twilioResponse = await client.messages.create({
      body: message,
      from: `whatsapp:${TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${formattedPhone}`
    });
    
    console.log("WhatsApp message sent successfully", twilioResponse.sid);
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: twilioResponse.sid 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send WhatsApp message" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
