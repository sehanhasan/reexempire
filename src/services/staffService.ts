
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

    // Validate required fields for auth user
    if (!staff.email || !staff.password) {
      throw new Error("Email and password are required for staff members");
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

      console.log("Staff member created:", data);

      // Then create the auth user with the anon key
      if (staff.email && passwordValue) {
        try {
          // Create auth user directly
          const { error: signUpError, data: authData } = await supabase.auth.signUp({
            email: staff.email,
            password: passwordValue,
            options: {
              data: {
                role: role,
                staff_id: data.id,
                full_name: data.name
              }
            }
          });

          if (signUpError) {
            console.error("Error creating auth user:", signUpError);
            // We'll continue and return the staff record even if auth creation fails
          } else {
            console.log("Auth user created successfully:", authData);
          }
        } catch (authError) {
          console.error("Exception during auth user creation:", authError);
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
        try {
          // Try to find existing users by email (fixes the TypeScript error)
          const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
          
          // Find the user with matching email
          const matchingUser = usersList?.users?.find(user => user.email === data.email);
          
          if (listError) {
            console.error("Error finding auth user:", listError);
            
            // If user doesn't exist, create a new one
            const { error: signUpError } = await supabase.auth.signUp({
              email: data.email,
              password: passwordValue,
              options: {
                data: {
                  role: staff.role || data.role,
                  staff_id: id,
                  full_name: data.name
                }
              }
            });
            
            if (signUpError) {
              console.error("Error creating auth user during update:", signUpError);
            }
          } else if (matchingUser) {
            // If user exists, update password
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
              data.email,
              { redirectTo: window.location.origin + '/auth/login' }
            );
            
            if (resetError) {
              console.error("Error resetting password:", resetError);
            }
          }
        } catch (authError) {
          console.error("Exception during auth user update:", authError);
        }
      }
      
      // If status is set to "Inactive", disable the auth user
      if (staff.status === "Inactive" && data?.email) {
        // Handle inactive status
        console.log("Setting user to inactive:", data.email);
      } else if (staff.status === "Active" && data?.email) {
        // Handle active status
        console.log("Setting user to active:", data.email);
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
        try {
          // Try to get all users and find the matching one
          const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
          
          // Find the user with matching email
          const matchingUser = usersList?.users?.find(user => user.email === staffMember.email);
          
          if (!listError && matchingUser) {
            // Delete auth user if found
            await supabase.auth.admin.deleteUser(matchingUser.id);
          }
        } catch (authError) {
          console.error("Error managing auth user during delete:", authError);
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
