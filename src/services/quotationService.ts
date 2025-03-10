import { supabase } from "@/integrations/supabase/client";
import { Quotation, QuotationItem } from "@/types/database";

interface QuotationItemInput extends Omit<QuotationItem, "id" | "created_at" | "updated_at"> {
  category?: string;
}

export const quotationService = {
  async getAll(): Promise<Quotation[]> {
    const { data, error } = await supabase
      .from("quotations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quotations:", error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<Quotation | null> {
    const { data, error } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching quotation with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async create(quotation: Omit<Quotation, "id" | "created_at" | "updated_at">): Promise<Quotation> {
    const { data, error } = await supabase
      .from("quotations")
      .insert([quotation])
      .select()
      .single();

    if (error) {
      console.error("Error creating quotation:", error);
      throw error;
    }

    return data;
  },

  async update(id: string, quotation: Partial<Omit<Quotation, "id" | "created_at" | "updated_at">>): Promise<Quotation> {
    const { data, error } = await supabase
      .from("quotations")
      .update(quotation)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating quotation with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("quotations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting quotation with id ${id}:`, error);
      throw error;
    }
  },

  async getItemsByQuotationId(quotationId: string): Promise<QuotationItem[]> {
    const { data, error } = await supabase
      .from("quotation_items")
      .select("*")
      .eq("quotation_id", quotationId)
      .order("id");

    if (error) {
      console.error(`Error fetching items for quotation ${quotationId}:`, error);
      throw error;
    }

    return data || [];
  },

  async createItem(item: QuotationItemInput): Promise<QuotationItem> {
    const { data, error } = await supabase
      .from("quotation_items")
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error("Error creating quotation item:", error);
      throw error;
    }

    return data;
  },

  async updateItem(id: string, item: Partial<QuotationItemInput>): Promise<QuotationItem> {
    const { data, error } = await supabase
      .from("quotation_items")
      .update(item)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating quotation item with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from("quotation_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting quotation item with id ${id}:`, error);
      throw error;
    }
  },

  async deleteAllItems(quotationId: string): Promise<void> {
    const { error } = await supabase
      .from("quotation_items")
      .delete()
      .eq("quotation_id", quotationId);

    if (error) {
      console.error(`Error deleting all items for quotation ${quotationId}:`, error);
      throw error;
    }
  }
};
