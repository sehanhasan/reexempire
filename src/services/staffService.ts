
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

    // Ensure all staff members have the required properties
    const staffWithNotes = data?.map(staff => ({
      ...staff,
      notes: staff.notes || null // Ensure notes property exists
    })) || [];

    return staffWithNotes;
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

    // Ensure the staff member has the notes property
    return data ? {
      ...data,
      notes: data.notes || null
    } : null;
  },

  async create(staff: Partial<Staff>): Promise<Staff> {
    if (!staff.name && staff.first_name && staff.last_name) {
      staff.name = `${staff.first_name} ${staff.last_name}`;
    }

    // Ensure join_date is set as it's required by Supabase
    if (!staff.join_date) {
      staff.join_date = new Date().toISOString().split('T')[0];
    }

    // Create a new object with required properties to satisfy TypeScript
    const staffData = {
      name: staff.name || "",
      join_date: staff.join_date,
      position: staff.position,
      email: staff.email,
      phone: staff.phone,
      status: staff.status || "Active",
      department: staff.department,
      employment_type: staff.employment_type,
      gender: staff.gender,
      address: staff.address,
      city: staff.city,
      state: staff.state,
      postal_code: staff.postal_code,
      passport: staff.passport,
      username: staff.username,
      emergency_contact_name: staff.emergency_contact_name,
      emergency_contact_relationship: staff.emergency_contact_relationship,
      emergency_contact_phone: staff.emergency_contact_phone,
      emergency_contact_email: staff.emergency_contact_email,
      notes: staff.notes || null  // Ensure notes property is included
    };

    try {
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
    } catch (error) {
      console.error("Failed to create staff member:", error);
      throw error;
    }
  },

  async update(id: string, staff: Partial<Staff>): Promise<Staff> {
    if (staff.first_name && staff.last_name) {
      staff.name = `${staff.first_name} ${staff.last_name}`;
    }

    // Ensure the notes field is included
    const updatedStaff = {
      ...staff,
      notes: staff.notes !== undefined ? staff.notes : null
    };

    try {
      const { data, error } = await supabase
        .from("staff")
        .update(updatedStaff)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating staff member with id ${id}:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Failed to update staff member with id ${id}:`, error);
      throw error;
    }
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
      console.error(`Failed to delete staff member with id ${id}:`, error);
      throw error;
    }
  }
};
