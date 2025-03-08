
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

    // Convert the data to Staff type with role property
    const staffMembers = data?.map(staff => ({
      ...staff,
      // Ensure role property exists with the correct type
      role: (staff.role as "Staff" | "Manager" | "Admin") || "Staff"
    })) || [];

    return staffMembers;
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

    // Return data with the correct Staff type
    return data ? {
      ...data,
      // Ensure role property exists with the correct type
      role: (data.role as "Staff" | "Manager" | "Admin") || "Staff"
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

    // Store password separately
    const passwordValue = staff.password;
    
    // Ensure role is of the correct type
    const role = staff.role || "Staff";
    
    // Remove password from the object to be inserted
    const { password, ...staffDataForInsert } = staff as any;
    
    // Create a data object that includes the role property
    const staffDataWithRole = {
      ...staffDataForInsert,
      role // Add role field explicitly
    };

    try {
      // First create the staff member in the database
      const { data, error } = await supabase
        .from("staff")
        .insert(staffDataWithRole)
        .select()
        .single();

      if (error) {
        console.error("Error creating staff member:", error);
        throw error;
      }

      // Then create the auth user if email is provided
      if (staff.email && passwordValue) {
        // Create auth user
        const authResponse = await supabase.auth.admin.createUser({
          email: staff.email,
          password: passwordValue,
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

      // Return data with the correct Staff type
      return {
        ...data,
        role: (data.role as "Staff" | "Manager" | "Admin") || "Staff"
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
    
    // Store password separately
    const passwordValue = staff.password;
    
    // Create a new object without password for database update
    const { password, ...staffDataForUpdate } = staff as any;

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
      if (data?.email && passwordValue) {
        // Find user by email
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (userError) {
          console.error("Error listing users:", userError);
        }
        
        // Apply type assertion to fix the TypeScript error
        const users = userData?.users || [];
        const user = users.find(u => u.email === data.email);
        
        if (user) {
          // Update user password
          const updateResponse = await supabase.auth.admin.updateUserById(
            user.id,
            { password: passwordValue }
          );
          
          if (updateResponse.error) {
            console.error("Error updating user password:", updateResponse.error);
          }
        }
      }
      
      // If status is set to "Inactive", disable the auth user
      if (staff.status === "Inactive" && data?.email) {
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (userError) {
          console.error("Error listing users:", userError);
        }
        
        // Apply type assertion to fix the TypeScript error
        const users = userData?.users || [];
        const user = users.find(u => u.email === data.email);
        
        if (user) {
          await supabase.auth.admin.updateUserById(
            user.id,
            { 
              user_metadata: {
                ...user.user_metadata,
                disabled: true
              } 
            }
          );
        }
      } else if (staff.status === "Active" && data?.email) {
        // If status is set to "Active", enable the auth user
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (userError) {
          console.error("Error listing users:", userError);
        }
        
        // Apply type assertion to fix the TypeScript error
        const users = userData?.users || [];
        const user = users.find(u => u.email === data.email);
        
        if (user) {
          await supabase.auth.admin.updateUserById(
            user.id,
            { 
              user_metadata: {
                ...user.user_metadata,
                disabled: false
              } 
            }
          );
        }
      }
      
      // Also update the user metadata if role has changed
      if (staff.role && data?.email) {
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (userError) {
          console.error("Error listing users:", userError);
        }
        
        // Apply type assertion to fix the TypeScript error
        const users = userData?.users || [];
        const user = users.find(u => u.email === data.email);
        
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

      // Return data with the correct Staff type
      return {
        ...data,
        role: (data.role as "Staff" | "Manager" | "Admin") || "Staff"
      };
    } catch (error) {
      console.error(`Failed to update staff member with id ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // First get the staff member to get their email
      const { data: staffMember, error: staffError } = await supabase
        .from("staff")
        .select("email")
        .eq("id", id)
        .single();
      
      if (staffError) {
        console.error(`Error fetching staff member with id ${id}:`, staffError);
      }
      
      // Delete the auth user if email exists
      if (staffMember?.email) {
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (userError) {
          console.error("Error listing users:", userError);
        }
        
        // Apply type assertion to fix the TypeScript error
        const users = userData?.users || [];
        const user = users.find(u => u.email === staffMember.email);
        
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
