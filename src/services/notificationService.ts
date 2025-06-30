
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
    const { data, error } = await supabase
      .from("notifications")
      .insert([{
        user_id: '00000000-0000-0000-0000-000000000000', // Public notifications for now
        ...notification
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      throw error;
    }

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
