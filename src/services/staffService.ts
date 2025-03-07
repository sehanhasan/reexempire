
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

    // Ensure join_date is set as it's required by Supabase
    if (!staff.join_date) {
      staff.join_date = new Date().toISOString().split('T')[0];
    }

    // Create a new object with required properties
    const staffData = {
      name: staff.name || "",
      join_date: staff.join_date,
      first_name: staff.first_name || "",
      last_name: staff.last_name || "",
      position: staff.position || "",
      email: staff.email || null,
      phone: staff.phone || null,
      status: staff.status || "Active",
      department: staff.department || null,
      employment_type: staff.employment_type || null,
      gender: staff.gender || null,
      address: staff.address || null,
      city: staff.city || null,
      state: staff.state || null,
      postal_code: staff.postal_code || null,
      passport: staff.passport || null,
      username: staff.username || null,
      emergency_contact_name: staff.emergency_contact_name || null,
      emergency_contact_relationship: staff.emergency_contact_relationship || null,
      emergency_contact_phone: staff.emergency_contact_phone || null,
      emergency_contact_email: staff.emergency_contact_email || null
    };

    const { data, error } = await supabase
      .from("staff")
      .insert(staffData)
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
    try {
      const { error } = await supabase
        .from("staff")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(`Error deleting staff member with id ${id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Failed to delete staff member:`, error);
      throw error;
    }
  }
};
