import { supabase } from "@/integrations/supabase/client";
import { Appointment } from "@/types/database";

export const appointmentService = {
  async getAll(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching appointments:", error);
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
    const { data, error } = await supabase
      .from("appointments")
      .update(appointment)
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

  async getAppointmentsByStaffId(staffId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("staff_id", staffId)
      .order("appointment_date", { ascending: true });

    if (error) {
      console.error(`Error fetching appointments for staff ${staffId}:`, error);
      throw error;
    }

    return data || [];
  },
};
