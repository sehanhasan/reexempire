
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

    // Convert the data to Staff type with notes property
    const staffWithNotes = data?.map(staff => ({
      ...staff,
      notes: null // Add notes property with null default
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

    // Add notes property to staff data
    return data ? {
      ...data,
      notes: null // Add notes property with null default
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

    // Create a new object with required properties for database insert
    // Remove the notes property as it's not in the database schema
    const { notes, ...staffDataForInsert } = {
      name: staff.name || "",
      join_date: staff.join_date,
      position: staff.position || null,
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
      emergency_contact_email: staff.emergency_contact_email || null,
      first_name: staff.first_name || "",
      last_name: staff.last_name || ""
    };

    try {
      const { data, error } = await supabase
        .from("staff")
        .insert(staffDataForInsert)
        .select()
        .single();

      if (error) {
        console.error("Error creating staff member:", error);
        throw error;
      }

      // Add notes property to returned data
      return {
        ...data,
        notes: null
      };
    } catch (error) {
      console.error("Failed to create staff member:", error);
      throw error;
    }
  },

  async update(id: string, staff: Partial<Staff>): Promise<Staff> {
    if (staff.first_name && staff.last_name) {
      staff.name = `${staff.first_name} ${staff.last_name}`;
    }

    // Remove the notes property if it exists since it's not in the database schema
    const { notes, ...staffDataForUpdate } = staff;

    try {
      const { data, error } = await supabase
        .from("staff")
        .update(staffDataForUpdate)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating staff member with id ${id}:`, error);
        throw error;
      }

      // Add notes property to returned data
      return {
        ...data,
        notes: null
      };
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
