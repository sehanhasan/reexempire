
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceImage } from "@/types/database";

const getAll = async (): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

const getById = async (id: string): Promise<Invoice | null> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data || null;
};

const create = async (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([invoice])
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const update = async (id: string, updates: Partial<Invoice>): Promise<Invoice | null> => {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data || null;
};

const deleteInvoice = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};

const getItemsByInvoiceId = async (invoiceId: string) => {
  const { data, error } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId);

  if (error) {
    throw error;
  }

  return data;
};

const createItem = async (item: any) => {
  const { data, error } = await supabase
    .from('invoice_items')
    .insert([item])
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const updateItem = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('invoice_items')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const deleteItem = async (id: string) => {
  const { error } = await supabase
    .from('invoice_items')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};

// Add invoice image - using a more TypeScript-friendly approach
const addInvoiceImage = async (invoiceId: string, imageUrl: string) => {
  // Using a raw query approach to insert into invoice_images table
  const { data, error } = await supabase
    .rpc('add_invoice_image', {
      p_invoice_id: invoiceId,
      p_image_url: imageUrl
    } as any);
  
  if (error) throw error;
  return data;
};

// Get invoice images - using a more TypeScript-friendly approach
const getInvoiceImages = async (invoiceId: string): Promise<InvoiceImage[]> => {
  // Using a raw query approach to select from invoice_images table
  const { data, error } = await supabase
    .rpc('get_invoice_images', {
      p_invoice_id: invoiceId
    } as any);
  
  if (error) throw error;
  return data || [];
};

// Define deleteItemsByInvoiceId function
const deleteItemsByInvoiceId = async (invoiceId: string): Promise<void> => {
  const { error } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId);

  if (error) {
    throw error;
  }
};

export const invoiceService = {
  getAll,
  getById,
  create,
  update,
  delete: deleteInvoice,
  getItemsByInvoiceId,
  createItem,
  updateItem,
  deleteItem,
  addInvoiceImage,
  getInvoiceImages,
  deleteItemsByInvoiceId
};

export default invoiceService;
