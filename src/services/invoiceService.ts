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

const generateInvoiceNumber = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('reference_number')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  const lastInvoice = data?.[0];
  if (!lastInvoice?.reference_number) {
    return 'INV-0001';
  }

  const lastNumber = parseInt(lastInvoice.reference_number.split('-')[1] || '0');
  const newNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `INV-${newNumber}`;
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

const addInvoiceImage = async (invoiceId: string, imageUrl: string) => {
  const { data, error } = await supabase
    .from('invoice_images')
    .insert([{
      invoice_id: invoiceId,
      image_url: imageUrl
    }])
    .select('*')
    .single();
  
  if (error) throw error;
  return data;
};

const getInvoiceImages = async (invoiceId: string): Promise<InvoiceImage[]> => {
  const { data, error } = await supabase
    .from('invoice_images')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

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
  generateInvoiceNumber,
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
