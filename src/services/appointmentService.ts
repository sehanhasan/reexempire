
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
    const { data, error } = await supabase
      .from("appointments")
      .insert([appointment])
      .select()
      .single();

    if (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }

    return data;
  },

  async update(id: string, appointment: Partial<Omit<Appointment, "id" | "created_at" | "updated_at">>): Promise<Appointment> {
    const cleanedAppointment = Object.fromEntries(
      Object.entries(appointment).filter(([_, v]) => v !== undefined)
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
  
  async generateWhatsAppShareLink(appointment: Appointment, staffMembers: any[]): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('send-appointment-notification', {
        body: { 
          appointment, 
          staffs: staffMembers
        }
      });
      
      if (error) {
        console.error("Error generating WhatsApp share link:", error);
        throw error;
      }
      
      return data.whatsappUrl;
    } catch (error) {
      console.error("Failed to generate WhatsApp share link:", error);
      throw error;
    }
  }
};
