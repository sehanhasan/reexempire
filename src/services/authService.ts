
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";

export const authService = {
  // Current session and user
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error fetching session:", error);
      throw error;
    }
    return session;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
    return user;
  },

  // Sign in, sign up, and sign out
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("Error signing in:", error);
      throw error;
    }
    return data;
  },

  async signUpWithEmail(email: string, password: string, userData: { full_name: string, role: 'admin' | 'staff', staff_id?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    if (error) {
      console.error("Error signing up:", error);
      throw error;
    }
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },

  // User profile management
  async getProfile(): Promise<Profile | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.user.id)
      .single();
    
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    
    return data;
  },

  async updateProfile(profileData: Partial<Profile>) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");
    
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('user_id', user.user.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
    
    return data;
  },

  // Role checking
  async hasRole(role: 'admin' | 'staff'): Promise<boolean> {
    const profile = await this.getProfile();
    return profile?.role === role;
  },

  async isAdmin(): Promise<boolean> {
    return this.hasRole('admin');
  },

  async isStaff(): Promise<boolean> {
    return this.hasRole('staff');
  }
};
