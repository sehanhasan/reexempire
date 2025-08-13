
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface PricingOption {
  id: string;
  subcategory_id: string;
  name: string;
  price: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export const categoryService = {
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
      console.error("Error fetching category:", error);
      return null;
    }

    // Fetch subcategories for this category
    const subcategories = await this.getSubcategories(id);
    
    return {
      ...data,
      subcategories
    };
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

  async update(id: string, category: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .update(category)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
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
      console.error("Error deleting category:", error);
      throw error;
    }
  },

  // Subcategory methods
  async getSubcategories(categoryId: string): Promise<Subcategory[]> {
    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .eq("category_id", categoryId)
      .order("name");

    if (error) {
      console.error("Error fetching subcategories:", error);
      throw error;
    }

    return data || [];
  },

  async getAllSubcategories(): Promise<Subcategory[]> {
    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching all subcategories:", error);
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

  async updateSubcategory(id: string, subcategory: Partial<Subcategory>): Promise<Subcategory> {
    const { data, error } = await supabase
      .from("subcategories")
      .update(subcategory)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subcategory:", error);
      throw error;
    }

    return data;
  },

  async deleteSubcategory(id: string): Promise<void> {
    // First, delete all pricing options for this subcategory
    const { error: pricingError } = await supabase
      .from("pricing_options")
      .delete()
      .eq("subcategory_id", id);

    if (pricingError) {
      console.error("Error deleting pricing options:", pricingError);
      throw pricingError;
    }

    // Then delete the subcategory
    const { error } = await supabase
      .from("subcategories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting subcategory:", error);
      throw error;
    }
  },

  // Pricing option methods
  async getPricingOptions(subcategoryId: string): Promise<PricingOption[]> {
    const { data, error } = await supabase
      .from("pricing_options")
      .select("*")
      .eq("subcategory_id", subcategoryId)
      .order("name");

    if (error) {
      console.error("Error fetching pricing options:", error);
      throw error;
    }

    return data || [];
  },

  async getAllPricingOptions(): Promise<PricingOption[]> {
    const { data, error } = await supabase
      .from("pricing_options")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching all pricing options:", error);
      throw error;
    }

    return data || [];
  },

  async createPricingOption(pricingOption: Omit<PricingOption, "id" | "created_at" | "updated_at">): Promise<PricingOption> {
    const { data, error } = await supabase
      .from("pricing_options")
      .insert([pricingOption])
      .select()
      .single();

    if (error) {
      console.error("Error creating pricing option:", error);
      throw error;
    }

    return data;
  },

  async updatePricingOption(id: string, pricingOption: Partial<PricingOption>): Promise<PricingOption> {
    const { data, error } = await supabase
      .from("pricing_options")
      .update(pricingOption)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating pricing option:", error);
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
      console.error("Error deleting pricing option:", error);
      throw error;
    }
  }
};
