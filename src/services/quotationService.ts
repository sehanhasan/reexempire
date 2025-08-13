
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
    console.log('Creating quotation with data:', quotation);
    
    const { data, error } = await supabase
      .from("quotations")
      .insert([quotation])
      .select()
      .single();

    if (error) {
      console.error("Error creating quotation:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('Successfully created quotation:', data);
    return data;
  },

  async update(id: string, quotation: Partial<Omit<Quotation, "id" | "created_at" | "updated_at"> & { signature_data?: string }>): Promise<Quotation> {
    console.log(`QuotationService: Updating quotation ${id} with data:`, quotation);
    
    try {
      const { data, error } = await supabase
        .from("quotations")
        .update(quotation)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(`QuotationService: Error updating quotation with id ${id}:`, error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        // Handle specific database errors
        if (error.code === 'PGRST301') {
          throw new Error('Quotation not found or access denied');
        } else if (error.code === '23505') {
          throw new Error('Duplicate data constraint violation');
        } else if (error.code === '23503') {
          throw new Error('Foreign key constraint violation');
        } else if (error.code === '42501') {
          throw new Error('Insufficient permissions to update quotation');
        } else {
          throw new Error(`Database error: ${error.message || 'Unknown error'}`);
        }
      }

      console.log(`QuotationService: Successfully updated quotation:`, data);
      return data;
    } catch (error) {
      console.error(`QuotationService: Caught error in update function:`, error);
      throw error;
    }
  },

  async updateStatus(id: string, status: string): Promise<Quotation> {
    console.log(`Updating quotation ${id} status to ${status}`);
    
    const { data, error } = await supabase
      .from("quotations")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating quotation status for id ${id}:`, error);
      throw error;
    }

    console.log(`Successfully updated quotation status:`, data);
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
    console.log('Creating quotation item:', item);
    
    const { data, error } = await supabase
      .from("quotation_items")
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error("Error creating quotation item:", error);
      console.error("Item data:", item);
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
  },

  generateWhatsAppShareUrl(quotationId: string, quotationNumber: string, customerName: string, previewUrl: string): string {
    const message = `Dear ${customerName},\n\n` +
      `Please find your quotation ${quotationNumber} for review at the link below: ` +
      `${previewUrl}\n\n` +
      `Please review the quotation details and accept it online with your signature.\n\n` +
      `If you have any questions, please don't hesitate to contact us.\n\n` +
      `Thank you,\nReex Empire`;
    
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  }
};
