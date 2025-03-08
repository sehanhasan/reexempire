
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

    // Convert the data to Staff type
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

    // Store notes separately as it's not in the database schema
    const notesValue = staff.notes;
    
    // Default role to Staff if not specified
    const role = staff.role || "Staff";
    
    // Remove notes from the object to be inserted
    const staffDataForInsert = {
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
      emergency_contact_name: staff.emergency_contact_name || null,
      emergency_contact_relationship: staff.emergency_contact_relationship || null,
      emergency_contact_phone: staff.emergency_contact_phone || null,
      emergency_contact_email: staff.emergency_contact_email || null,
      first_name: staff.first_name || "",
      last_name: staff.last_name || "",
      role: role
    };

    try {
      // First create the staff member in the database
      const { data, error } = await supabase
        .from("staff")
        .insert(staffDataForInsert)
        .select()
        .single();

      if (error) {
        console.error("Error creating staff member:", error);
        throw error;
      }

      // Then create the auth user if email is provided
      if (staff.email && staff.password) {
        // Create auth user
        const authResponse = await supabase.auth.admin.createUser({
          email: staff.email,
          password: staff.password,
          email_confirm: true,
          user_metadata: {
            role: role,
            staff_id: data.id,
            full_name: data.name
          }
        });

        if (authResponse.error) {
          console.error("Error creating auth user:", authResponse.error);
          // If auth user creation fails, we should still return the staff record
          // but log the error
        }
      }

      // Add notes property to returned data
      return {
        ...data,
        notes: notesValue
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

    // Store notes separately as it's not in the database schema
    const notesValue = staff.notes;
    const password = staff.password;
    
    // Create a new object without notes and password for database update
    const { notes, password: _, ...staffDataForUpdate } = staff;

    try {
      // Update staff record in database
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

      // If the staff email and a new password are provided, update the auth user
      if (data.email && password) {
        // Find user by email
        const { data: userData } = await supabase.auth.admin.listUsers();
        const user = userData.users.find(u => u.email === data.email);
        
        if (user) {
          // Update user password
          const updateResponse = await supabase.auth.admin.updateUserById(
            user.id,
            { password }
          );
          
          if (updateResponse.error) {
            console.error("Error updating user password:", updateResponse.error);
          }
        }
      }
      
      // If status is set to "Inactive", disable the auth user
      if (staff.status === "Inactive" && data.email) {
        const { data: userData } = await supabase.auth.admin.listUsers();
        const user = userData.users.find(u => u.email === data.email);
        
        if (user) {
          await supabase.auth.admin.updateUserById(
            user.id,
            { banned: true }
          );
        }
      } else if (staff.status === "Active" && data.email) {
        // If status is set to "Active", enable the auth user
        const { data: userData } = await supabase.auth.admin.listUsers();
        const user = userData.users.find(u => u.email === data.email);
        
        if (user) {
          await supabase.auth.admin.updateUserById(
            user.id,
            { banned: false }
          );
        }
      }
      
      // Also update the user metadata if role has changed
      if (staff.role && data.email) {
        const { data: userData } = await supabase.auth.admin.listUsers();
        const user = userData.users.find(u => u.email === data.email);
        
        if (user) {
          await supabase.auth.admin.updateUserById(
            user.id,
            { 
              user_metadata: {
                ...user.user_metadata,
                role: staff.role
              }
            }
          );
        }
      }

      // Add notes property to returned data
      return {
        ...data,
        notes: notesValue
      };
    } catch (error) {
      console.error(`Failed to update staff member with id ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // First get the staff member to get their email
      const { data: staffMember } = await supabase
        .from("staff")
        .select("email")
        .eq("id", id)
        .single();
      
      // Delete the auth user if email exists
      if (staffMember?.email) {
        const { data: userData } = await supabase.auth.admin.listUsers();
        const user = userData.users.find(u => u.email === staffMember.email);
        
        if (user) {
          await supabase.auth.admin.deleteUser(user.id);
        }
      }
      
      // Then delete the staff record
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
