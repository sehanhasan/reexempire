
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
  // If quotation_id is provided, get the reference number instead of storing the UUID
  let invoiceData = { ...invoice };
  
  if (invoice.quotation_id) {
    const { data: quotationData, error: quotationError } = await supabase
      .from('quotations')
      .select('reference_number')
      .eq('id', invoice.quotation_id)
      .single();
      
    if (quotationError) {
      console.error('Error fetching quotation reference:', quotationError);
    } else {
      // Store the reference number in a custom field for display purposes
      invoiceData = {
        ...invoiceData,
        notes: invoiceData.notes 
          ? `${invoiceData.notes}\n\nQuotation Reference: ${quotationData.reference_number}`
          : `Quotation Reference: ${quotationData.reference_number}`
      };
    }
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert([invoiceData])
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

// Helper function to get quotation reference from invoice
const getQuotationReference = async (invoiceId: string): Promise<string | null> => {
  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('quotation_id')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice.quotation_id) {
      return null;
    }

    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('reference_number')
      .eq('id', invoice.quotation_id)
      .single();

    if (quotationError) {
      return null;
    }

    return quotation.reference_number;
  } catch (error) {
    console.error('Error fetching quotation reference:', error);
    return null;
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
  deleteItemsByInvoiceId,
  getQuotationReference
};

export default invoiceService;
