
import { supabase } from "@/integrations/supabase/client";
import { Category, Subcategory, PricingOption } from "@/types/database";

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*, subcategories(*)")
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
      .select("*, subcategories(*)")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching category with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async create(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    const { name, description } = category;
    
    // First create the category
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .insert([{ name, description }])
      .select("*")
      .single();

    if (categoryError) {
      console.error("Error creating category:", categoryError);
      throw categoryError;
    }
    
    // Then create any subcategories if they exist
    if (category.subcategories && category.subcategories.length > 0) {
      const subcategoryData = category.subcategories.map(sub => ({
        name: sub.name,
        description: sub.description,
        price: sub.price,
        category_id: categoryData.id
      }));
      
      const { error: subcategoryError } = await supabase
        .from("subcategories")
        .insert(subcategoryData);
        
      if (subcategoryError) {
        console.error("Error creating subcategories:", subcategoryError);
        throw subcategoryError;
      }
    }

    return categoryData;
  },

  async update(id: string, category: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>): Promise<Category> {
    const { name, description, subcategories } = category;
    
    // Update the category
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .update({ name, description })
      .eq("id", id)
      .select("*")
      .single();

    if (categoryError) {
      console.error(`Error updating category with id ${id}:`, categoryError);
      throw categoryError;
    }
    
    // Handle subcategories if provided
    if (subcategories && subcategories.length > 0) {
      // Update or create subcategories
      for (const sub of subcategories) {
        if (sub.id) {
          // Update existing subcategory
          const { error } = await supabase
            .from("subcategories")
            .update({
              name: sub.name,
              description: sub.description,
              price: sub.price
            })
            .eq("id", sub.id);
            
          if (error) {
            console.error(`Error updating subcategory with id ${sub.id}:`, error);
            throw error;
          }
        } else {
          // Create new subcategory
          const { error } = await supabase
            .from("subcategories")
            .insert({
              name: sub.name,
              description: sub.description,
              price: sub.price,
              category_id: id
            });
            
          if (error) {
            console.error("Error creating subcategory:", error);
            throw error;
          }
        }
      }
    }

    return categoryData;
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
  
  // Add these new methods
  async getAllSubcategories(): Promise<Subcategory[]> {
    const { data, error } = await supabase
      .from("subcategories")
      .select("*");

    if (error) {
      console.error("Error fetching subcategories:", error);
      throw error;
    }

    return data || [];
  },
  
  async getSubcategoriesByCategoryId(categoryId: string): Promise<Subcategory[]> {
    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .eq("category_id", categoryId);

    if (error) {
      console.error(`Error fetching subcategories for category ${categoryId}:`, error);
      throw error;
    }

    return data || [];
  },
  
  async getAllPricingOptions(): Promise<PricingOption[]> {
    const { data, error } = await supabase
      .from("pricing_options")
      .select("*");

    if (error) {
      console.error("Error fetching pricing options:", error);
      throw error;
    }

    return data || [];
  }
};
