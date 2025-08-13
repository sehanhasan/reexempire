
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const notificationService = {
  async create(notification: {
    title: string;
    message: string;
    type: string;
    reference_id?: string;
  }): Promise<Notification> {
    console.log('Creating notification:', notification);
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found, skipping notification creation');
      throw new Error('User must be authenticated to create notifications');
    }
    
    const { data, error } = await supabase
      .from("notifications")
      .insert([{
        user_id: user.id, // Use actual authenticated user ID
        ...notification
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      throw error;
    }

    console.log('Notification created successfully:', data);
    return data;
  },

  async getAll(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }

    return data || [];
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }
};
