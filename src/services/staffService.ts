import { supabase } from "@/integrations/supabase/client";
import { Staff } from "@/types/database";

export const staffService = {
  async getAll(): Promise<Staff[]> {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching staff members:", error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<Staff | null> {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching staff member with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async create(staff: Partial<Staff>): Promise<Staff> {
    if (!staff.name && staff.first_name && staff.last_name) {
      staff.name = `${staff.first_name} ${staff.last_name}`;
    }

    if (!staff.join_date) {
      staff.join_date = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from("staff")
      .insert(staff)
      .select()
      .single();

    if (error) {
      console.error("Error creating staff member:", error);
      throw error;
    }

    return data;
  },

  async update(id: string, staff: Partial<Staff>): Promise<Staff> {
    if (staff.first_name && staff.last_name) {
      staff.name = `${staff.first_name} ${staff.last_name}`;
    }

    const { data, error } = await supabase
      .from("staff")
      .update(staff)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating staff member with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting staff member with id ${id}:`, error);
      throw error;
    }
  }
};
