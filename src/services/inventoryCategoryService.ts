import { supabase } from "@/integrations/supabase/client";

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const inventoryCategoryService = {
  // Get all inventory categories
  async getAll(): Promise<InventoryCategory[]> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching inventory categories:', error);
      throw error;
    }

    return data || [];
  },

  // Get inventory category by ID
  async getById(id: string): Promise<InventoryCategory | null> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching inventory category:', error);
      throw error;
    }

    return data;
  },

  // Create inventory category
  async create(category: { name: string; description?: string }): Promise<InventoryCategory> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .insert([category])
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory category:', error);
      throw error;
    }

    return data;
  },

  // Update inventory category
  async update(id: string, category: { name?: string; description?: string }): Promise<InventoryCategory> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating inventory category:', error);
      throw error;
    }

    return data;
  },

  // Delete inventory category
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting inventory category:', error);
      throw error;
    }
  }
};