
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "@/types/database";

interface InvoiceItemInput extends Omit<InvoiceItem, "id" | "created_at" | "updated_at"> {
  category?: string;
  display_order?: number;
}

export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching invoice with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async create(invoice: Omit<Invoice, "id" | "created_at" | "updated_at">): Promise<Invoice> {
    const { data, error } = await supabase
      .from("invoices")
      .insert([invoice])
      .select()
      .single();

    if (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }

    return data;
  },

  async update(id: string, invoice: Partial<Omit<Invoice, "id" | "created_at" | "updated_at">>): Promise<Invoice> {
    const { data, error } = await supabase
      .from("invoices")
      .update(invoice)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating invoice with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting invoice with id ${id}:`, error);
      throw error;
    }
  },

  // Invoice Items
  async getItemsByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    const { data, error } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("id");

    if (error) {
      console.error(`Error fetching items for invoice ${invoiceId}:`, error);
      throw error;
    }

    return data || [];
  },

  async createItem(item: InvoiceItemInput): Promise<InvoiceItem> {
    const { data, error } = await supabase
      .from("invoice_items")
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error("Error creating invoice item:", error);
      throw error;
    }

    return data;
  },

  async updateItem(id: string, item: Partial<InvoiceItemInput>): Promise<InvoiceItem> {
    const { data, error } = await supabase
      .from("invoice_items")
      .update(item)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating invoice item with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from("invoice_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting invoice item with id ${id}:`, error);
      throw error;
    }
  },

  async deleteAllItems(invoiceId: string): Promise<void> {
    const { error } = await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", invoiceId);

    if (error) {
      console.error(`Error deleting all items for invoice ${invoiceId}:`, error);
      throw error;
    }
  },
  
  async storePDF(invoiceId: string, pdfUrl: string): Promise<void> {
    const { error } = await supabase
      .from("invoices")
      .update({ pdf_url: pdfUrl })
      .eq("id", invoiceId);
    
    if (error) {
      console.error(`Error storing PDF for invoice ${invoiceId}:`, error);
      throw error;
    }
  }
};
