
import { supabase } from "@/integrations/supabase/client";
import { Category, Subcategory, PricingOption } from "@/types/database";

export const categoryService = {
  // Categories
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching category with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async create(category: Omit<Category, "id" | "created_at" | "updated_at">): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .insert([category])
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      throw error;
    }

    return data;
  },

  async update(id: string, category: Partial<Omit<Category, "id" | "created_at" | "updated_at">>): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .update(category)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating category with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting category with id ${id}:`, error);
      throw error;
    }
  },

  // Subcategories
  async getSubcategoriesByCategoryId(categoryId: string): Promise<Subcategory[]> {
    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .eq("category_id", categoryId)
      .order("name");

    if (error) {
      console.error(`Error fetching subcategories for category ${categoryId}:`, error);
      throw error;
    }

    return data || [];
  },

  async createSubcategory(subcategory: Omit<Subcategory, "id" | "created_at" | "updated_at">): Promise<Subcategory> {
    const { data, error } = await supabase
      .from("subcategories")
      .insert([subcategory])
      .select()
      .single();

    if (error) {
      console.error("Error creating subcategory:", error);
      throw error;
    }

    return data;
  },

  async updateSubcategory(id: string, subcategory: Partial<Omit<Subcategory, "id" | "created_at" | "updated_at">>): Promise<Subcategory> {
    const { data, error } = await supabase
      .from("subcategories")
      .update(subcategory)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating subcategory with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async deleteSubcategory(id: string): Promise<void> {
    const { error } = await supabase
      .from("subcategories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting subcategory with id ${id}:`, error);
      throw error;
    }
  },

  // Pricing Options
  async getPricingOptionsBySubcategoryId(subcategoryId: string): Promise<PricingOption[]> {
    const { data, error } = await supabase
      .from("pricing_options")
      .select("*")
      .eq("subcategory_id", subcategoryId)
      .order("name");

    if (error) {
      console.error(`Error fetching pricing options for subcategory ${subcategoryId}:`, error);
      throw error;
    }

    return data || [];
  },

  async createPricingOption(option: Omit<PricingOption, "id" | "created_at" | "updated_at">): Promise<PricingOption> {
    const { data, error } = await supabase
      .from("pricing_options")
      .insert([option])
      .select()
      .single();

    if (error) {
      console.error("Error creating pricing option:", error);
      throw error;
    }

    return data;
  },

  async updatePricingOption(id: string, option: Partial<Omit<PricingOption, "id" | "created_at" | "updated_at">>): Promise<PricingOption> {
    const { data, error } = await supabase
      .from("pricing_options")
      .update(option)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating pricing option with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async deletePricingOption(id: string): Promise<void> {
    const { error } = await supabase
      .from("pricing_options")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting pricing option with id ${id}:`, error);
      throw error;
    }
  }
};
