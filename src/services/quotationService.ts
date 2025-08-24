import { supabase } from "@/integrations/supabase/client";
import { Quotation, QuotationItem } from "@/types/database";

interface QuotationItemInput extends Omit<QuotationItem, "id" | "created_at" | "updated_at"> {
  category?: string;
}

export const quotationService = {
  async getAll(): Promise<Quotation[]> {
    try {
      console.log("QuotationService: Fetching all quotations...");
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("QuotationService: Error fetching quotations:", error);
        throw new Error(`Failed to fetch quotations: ${error.message}`);
      }

      console.log("QuotationService: Successfully fetched quotations:", data?.length || 0);
      return data || [];
    } catch (error) {
      console.error("QuotationService: Unexpected error in getAll:", error);
      throw error;
    }
  },

  async getById(id: string): Promise<Quotation | null> {
    try {
      console.log(`QuotationService: Fetching quotation with id ${id}...`);
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(`QuotationService: Error fetching quotation with id ${id}:`, error);
        throw new Error(`Failed to fetch quotation: ${error.message}`);
      }

      console.log(`QuotationService: Successfully fetched quotation:`, data);
      return data;
    } catch (error) {
      console.error(`QuotationService: Unexpected error in getById:`, error);
      throw error;
    }
  },

  async generateUniqueReferenceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    
    let counter = 1;
    let referenceNumber: string;
    
    do {
      const sequence = counter.toString().padStart(4, '0');
      referenceNumber = `QT-${year}-${sequence}`;
      
      console.log(`QuotationService: Checking reference number: ${referenceNumber}`);
      
      // Check if this reference number already exists
      const { data, error } = await supabase
        .from("quotations")
        .select("id")
        .eq("reference_number", referenceNumber)
        .maybeSingle();
      
      if (error) {
        console.error("QuotationService: Error checking reference number:", error);
        throw new Error(`Error checking reference number: ${error.message}`);
      }
      
      if (!data) {
        // Reference number is unique
        console.log(`QuotationService: Found unique reference number: ${referenceNumber}`);
        break;
      }
      
      counter++;
    } while (counter <= 9999); // Prevent infinite loop
    
    if (counter > 9999) {
      throw new Error("Unable to generate unique reference number - sequence exhausted");
    }
    
    return referenceNumber;
  },

  async create(quotation: Omit<Quotation, "id" | "created_at" | "updated_at">): Promise<Quotation> {
    try {
      console.log("QuotationService: Creating quotation with data:", quotation);
      
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
        console.error("QuotationService: Error creating quotation:", error);
        
        // If it's a duplicate reference number error, try generating a new one
        if (error.code === '23505' && error.message.includes('reference_number')) {
          console.log("QuotationService: Duplicate reference number detected, generating new one...");
          quotationData.reference_number = await this.generateUniqueReferenceNumber();
          
          const { data: retryData, error: retryError } = await supabase
            .from("quotations")
            .insert([quotationData])
            .select()
            .single();
            
          if (retryError) {
            console.error("QuotationService: Error creating quotation on retry:", retryError);
            throw new Error(`Failed to create quotation: ${retryError.message}`);
          }
          
          console.log("QuotationService: Successfully created quotation on retry:", retryData);
          return retryData;
        }
        
        throw new Error(`Failed to create quotation: ${error.message}`);
      }

      console.log("QuotationService: Successfully created quotation:", data);
      return data;
    } catch (error) {
      console.error("QuotationService: Unexpected error in create:", error);
      throw error;
    }
  },

  async update(id: string, quotation: Partial<Omit<Quotation, "id" | "created_at" | "updated_at"> & { signature_data?: string }>): Promise<Quotation> {
    try {
      console.log(`QuotationService: Updating quotation ${id} with data:`, quotation);
      
      const { data, error } = await supabase
        .from("quotations")
        .update(quotation)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(`QuotationService: Error updating quotation with id ${id}:`, error);
        throw new Error(`Failed to update quotation: ${error.message}`);
      }

      console.log(`QuotationService: Successfully updated quotation:`, data);
      return data;
    } catch (error) {
      console.error(`QuotationService: Unexpected error in update:`, error);
      throw error;
    }
  },

  async updateStatus(id: string, status: string): Promise<Quotation> {
    try {
      console.log(`QuotationService: Updating quotation ${id} status to ${status}`);
      
      const { data, error } = await supabase
        .from("quotations")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(`QuotationService: Error updating quotation status for id ${id}:`, error);
        throw new Error(`Failed to update quotation status: ${error.message}`);
      }

      console.log(`QuotationService: Successfully updated quotation status:`, data);
      return data;
    } catch (error) {
      console.error(`QuotationService: Unexpected error in updateStatus:`, error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      console.log(`QuotationService: Deleting quotation with id ${id}`);
      
      const { error } = await supabase
        .from("quotations")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(`QuotationService: Error deleting quotation with id ${id}:`, error);
        throw new Error(`Failed to delete quotation: ${error.message}`);
      }

      console.log(`QuotationService: Successfully deleted quotation with id ${id}`);
    } catch (error) {
      console.error(`QuotationService: Unexpected error in delete:`, error);
      throw error;
    }
  },

  async getItemsByQuotationId(quotationId: string): Promise<QuotationItem[]> {
    try {
      console.log(`QuotationService: Fetching items for quotation ${quotationId}`);
      
      const { data, error } = await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("id");

      if (error) {
        console.error(`QuotationService: Error fetching items for quotation ${quotationId}:`, error);
        throw new Error(`Failed to fetch quotation items: ${error.message}`);
      }

      console.log(`QuotationService: Successfully fetched ${data?.length || 0} items for quotation ${quotationId}`);
      return data || [];
    } catch (error) {
      console.error(`QuotationService: Unexpected error in getItemsByQuotationId:`, error);
      throw error;
    }
  },

  async getCustomerByQuotationId(quotationId: string) {
    try {
      console.log(`QuotationService: Fetching customer for quotation ${quotationId}`);
      
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          customers (*)
        `)
        .eq("id", quotationId)
        .single();

      if (error) {
        console.error(`QuotationService: Error fetching customer for quotation ${quotationId}:`, error);
        throw new Error(`Failed to fetch customer: ${error.message}`);
      }

      console.log(`QuotationService: Successfully fetched customer for quotation ${quotationId}`);
      return data?.customers;
    } catch (error) {
      console.error(`QuotationService: Unexpected error in getCustomerByQuotationId:`, error);
      throw error;
    }
  },

  async getQuotationItems(quotationId: string): Promise<QuotationItem[]> {
    return this.getItemsByQuotationId(quotationId);
  },

  async createItem(item: QuotationItemInput): Promise<QuotationItem> {
    try {
      console.log("QuotationService: Creating quotation item:", item);
      
      const { data, error } = await supabase
        .from("quotation_items")
        .insert([item])
        .select()
        .single();

      if (error) {
        console.error("QuotationService: Error creating quotation item:", error);
        throw new Error(`Failed to create quotation item: ${error.message}`);
      }

      console.log("QuotationService: Successfully created quotation item:", data);
      return data;
    } catch (error) {
      console.error("QuotationService: Unexpected error in createItem:", error);
      throw error;
    }
  },

  async updateItem(id: string, item: Partial<QuotationItemInput>): Promise<QuotationItem> {
    try {
      console.log(`QuotationService: Updating quotation item ${id} with:`, item);
      
      const { data, error } = await supabase
        .from("quotation_items")
        .update(item)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(`QuotationService: Error updating quotation item with id ${id}:`, error);
        throw new Error(`Failed to update quotation item: ${error.message}`);
      }

      console.log(`QuotationService: Successfully updated quotation item:`, data);
      return data;
    } catch (error) {
      console.error(`QuotationService: Unexpected error in updateItem:`, error);
      throw error;
    }
  },

  async deleteItem(id: string): Promise<void> {
    try {
      console.log(`QuotationService: Deleting quotation item with id ${id}`);
      
      const { error } = await supabase
        .from("quotation_items")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(`QuotationService: Error deleting quotation item with id ${id}:`, error);
        throw new Error(`Failed to delete quotation item: ${error.message}`);
      }

      console.log(`QuotationService: Successfully deleted quotation item with id ${id}`);
    } catch (error) {
      console.error(`QuotationService: Unexpected error in deleteItem:`, error);
      throw error;
    }
  },

  async deleteAllItems(quotationId: string): Promise<void> {
    try {
      console.log(`QuotationService: Deleting all items for quotation ${quotationId}`);
      
      const { error } = await supabase
        .from("quotation_items")
        .delete()
        .eq("quotation_id", quotationId);

      if (error) {
        console.error(`QuotationService: Error deleting all items for quotation ${quotationId}:`, error);
        throw new Error(`Failed to delete quotation items: ${error.message}`);
      }

      console.log(`QuotationService: Successfully deleted all items for quotation ${quotationId}`);
    } catch (error) {
      console.error(`QuotationService: Unexpected error in deleteAllItems:`, error);
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
