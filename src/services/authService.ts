
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  async signUp(email: string, password: string, userData: { full_name: string; role: 'admin' | 'staff' }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role,
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  },

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user;
  },

  async getUserProfile(): Promise<Profile | null> {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      
      if (!authUser.user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return null;
    }
  },

  async updateProfile(profile: Partial<Profile>): Promise<Profile | null> {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      
      if (!authUser.user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('user_id', authUser.user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating user profile:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Error in updateProfile:", error);
      return null;
    }
  },

  async getAllProfiles(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching all profiles:", error);
        return [];
      }

      return data as Profile[];
    } catch (error) {
      console.error("Error in getAllProfiles:", error);
      return [];
    }
  },

  async linkStaffToProfile(profileId: string, staffId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ staff_id: staffId })
        .eq('id', profileId);

      if (error) {
        console.error("Error linking staff to profile:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in linkStaffToProfile:", error);
      throw error;
    }
  }
};
