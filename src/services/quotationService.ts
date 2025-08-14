
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

  async generateUniqueReferenceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    let counter = 1;
    let referenceNumber: string;
    
    do {
      const sequence = counter.toString().padStart(3, '0');
      referenceNumber = `QUO-${year}${month}${day}-${sequence}`;
      
      // Check if this reference number already exists
      const { data } = await supabase
        .from("quotations")
        .select("id")
        .eq("reference_number", referenceNumber)
        .single();
      
      if (!data) {
        // Reference number is unique
        break;
      }
      
      counter++;
    } while (counter <= 999); // Prevent infinite loop
    
    if (counter > 999) {
      throw new Error("Unable to generate unique reference number");
    }
    
    return referenceNumber;
  },

  async create(quotation: Omit<Quotation, "id" | "created_at" | "updated_at">): Promise<Quotation> {
    // Generate unique reference number if not provided
    let quotationData = { ...quotation };
    if (!quotationData.reference_number) {
      quotationData.reference_number = await this.generateUniqueReferenceNumber();
    }

    const { data, error } = await supabase
      .from("quotations")
      .insert([quotationData])
      .select()
      .single();

    if (error) {
      console.error("Error creating quotation:", error);
      
      // If it's a duplicate reference number error, try generating a new one
      if (error.code === '23505' && error.message.includes('reference_number')) {
        console.log("Duplicate reference number detected, generating new one...");
        quotationData.reference_number = await this.generateUniqueReferenceNumber();
        
        const { data: retryData, error: retryError } = await supabase
          .from("quotations")
          .insert([quotationData])
          .select()
          .single();
          
        if (retryError) {
          console.error("Error creating quotation on retry:", retryError);
          throw retryError;
        }
        
        return retryData;
      }
      
      throw error;
    }

    return data;
  },

  async update(id: string, quotation: Partial<Omit<Quotation, "id" | "created_at" | "updated_at"> & { signature_data?: string }>): Promise<Quotation> {
    console.log(`QuotationService: Updating quotation ${id} with data:`, quotation);
    
    const { data, error } = await supabase
      .from("quotations")
      .update(quotation)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`QuotationService: Error updating quotation with id ${id}:`, error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw error;
    }

    console.log(`QuotationService: Successfully updated quotation:`, data);
    return data;
  },

  async updateStatus(id: string, status: string): Promise<Quotation> {
    console.log(`Updating quotation ${id} status to ${status}`);
    
    try {
      const { data, error } = await supabase
        .from("quotations")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating quotation status for id ${id}:`, error);
        throw new Error(`Failed to update quotation status: ${error.message}`);
      }

      console.log(`Successfully updated quotation status:`, data);
      return data;
    } catch (error) {
      console.error(`QuotationService: Error in updateStatus:`, error);
      throw error;
    }
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
