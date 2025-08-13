import { supabase } from "@/integrations/supabase/client";
import { Appointment } from "@/types/database";

export const appointmentService = {
  async getAll(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      throw error;
    }

    return data || [];
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error(`Error fetching appointments from ${startDate} to ${endDate}:`, error);
      throw error;
    }

    return data || [];
  },

  async getTodaysAppointments(date: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", date)
      .order("start_time", { ascending: true });

    if (error) {
      console.error(`Error fetching today's appointments for ${date}:`, error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching appointment with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async getByCustomerId(customerId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("customer_id", customerId)
      .order("appointment_date", { ascending: false });

    if (error) {
      console.error(`Error fetching appointments for customer ${customerId}:`, error);
      throw error;
    }

    return data || [];
  },

  async getByStaffId(staffId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("staff_id", staffId)
      .order("appointment_date", { ascending: false });

    if (error) {
      console.error(`Error fetching appointments for staff ${staffId}:`, error);
      throw error;
    }

    return data || [];
  },

  async create(appointment: Omit<Appointment, "id" | "created_at" | "updated_at">): Promise<Appointment> {
    // Handle "none" value for staff_id
    const cleanedAppointment = {
      ...appointment,
      staff_id: appointment.staff_id === "none" ? null : appointment.staff_id
    };

    const { data, error } = await supabase
      .from("appointments")
      .insert([cleanedAppointment])
      .select()
      .single();

    if (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }

    return data;
  },

  async update(id: string, appointment: Partial<Omit<Appointment, "id" | "created_at" | "updated_at">>): Promise<Appointment> {
    // Handle "none" value for staff_id
    const cleanedAppointment = Object.fromEntries(
      Object.entries(appointment)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, k === "staff_id" && v === "none" ? null : v])
    );

    const { data, error } = await supabase
      .from("appointments")
      .update(cleanedAppointment)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating appointment with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async updateStatus(id: string, status: string): Promise<Appointment> {
    console.log(`Updating appointment ${id} status to ${status}`);
    
    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating appointment status for id ${id}:`, error);
      throw error;
    }

    console.log(`Successfully updated appointment status:`, data);
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting appointment with id ${id}:`, error);
      throw error;
    }
  },

  generateWhatsAppShareUrl(appointment: Appointment, customerName: string | null = null, staffMembers: Array<{ id: string; name: string; phone?: string | null }> = []): string {
    const dateStr = new Date(appointment.appointment_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    const formatTime = (time: string) => {
      if (!time) return "";
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
    };
    
    let message = `*Appointment Details*\n\n`;
    message += `📅 *Date:* ${dateStr}\n`;
    message += `⏰ *Time:* ${formatTime(appointment.start_time)} - ${formatTime(appointment.end_time)}\n`;
    message += `📌 *Service:* ${appointment.title}\n`;
    
    // Show full Unit # including the complete unit number
    if (appointment.location) {
      // If location already contains a #, use it as is, otherwise format it
      if (appointment.location.includes('#')) {
        message += `🏠 *Unit #:* ${appointment.location.replace('#', '')}\n`;
      } else {
        message += `🏠 *Unit #:* ${appointment.location}\n`;
      }
    }
    
    if (staffMembers.length > 0) {
      message += `\n👨‍💼 *Staff Assigned*\n`;
      staffMembers.forEach(staff => {
        message += `- ${staff.name}${staff.phone ? ' ('+staff.phone+')' : ''}\n`;
      });
    }
    
    if (appointment.notes) {
      const cleanNotes = appointment.notes.replace(/image_url:[^\s]+/g, '').trim();
      if (cleanNotes) {
        message += `\n📝 *Notes*\n${cleanNotes}\n`;
      }
    }
    
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  }
};
