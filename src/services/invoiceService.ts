
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem as DBInvoiceItem } from "@/types/database";

interface InvoiceItemInput {
  invoice_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  category?: string;
}

interface InvoiceInput {
  customer_id: string;
  quotation_id?: string;
  reference_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  total: number;
  is_deposit_invoice?: boolean;
  deposit_amount?: number;
  deposit_percentage?: number;
  notes?: string | null;
  terms?: string | null;
  subject?: string | null;
  quotation_ref_number?: string | null;
}

const getAll = async (): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers (
        id,
        name,
        email,
        phone,
        address,
        unit_number,
        city,
        state,
        postal_code
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

const getById = async (id: string): Promise<Invoice | null> => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers (
        id,
        name,
        email,
        phone,
        address,
        unit_number,
        city,
        state,
        postal_code
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
};

const create = async (invoice: InvoiceInput): Promise<Invoice> => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([invoice])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const update = async (id: string, invoice: Partial<InvoiceInput>): Promise<Invoice> => {
  const { data, error } = await supabase
    .from('invoices')
    .update(invoice)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const remove = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};

const getItemsByInvoiceId = async (invoiceId: string): Promise<DBInvoiceItem[]> => {
  const { data, error } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('display_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};

const createItem = async (item: InvoiceItemInput): Promise<DBInvoiceItem> => {
  const { data, error } = await supabase
    .from('invoice_items')
    .insert([item])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
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

const generateNextReferenceNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `INV${currentYear}`;

  const { data, error } = await supabase
    .from('invoices')
    .select('reference_number')
    .like('reference_number', `${prefix}%`)
    .order('reference_number', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastRef = data[0].reference_number;
    const lastNumber = parseInt(lastRef.replace(prefix, ''));
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

const storePDFUrl = async (invoiceId: string, pdfUrl: string): Promise<void> => {
  const { error } = await supabase
    .from('invoices')
    .update({ pdf_url: pdfUrl })
    .eq('id', invoiceId);

  if (error) {
    throw error;
  }
};

const generateWhatsAppShareUrl = (invoiceId: string, invoiceNumber: string, customerName: string): string => {
  // Use permanent public URLs based on environment
  const baseUrl = window.location.hostname.includes('lovable.app') 
    ? 'https://reexempire.lovable.app'
    : window.location.origin;
  
  const invoiceUrl = `${baseUrl}/invoices/view/${invoiceId}`;
  
  const message = `Dear ${customerName},\n\n` +
    `Please find your invoice ${invoiceNumber} for review at the link below: ` +
    `${invoiceUrl}\n\n` +
    `You can review the invoice details and make payment.\n\n` +
    `If you have any questions, please don't hesitate to contact us.\n\n` +
    `Thank you,\nReex Empire Sdn Bhd`;
  
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

export const invoiceService = {
  getAll,
  getById,
  create,
  update,
  remove,
  getItemsByInvoiceId,
  createItem,
  deleteItemsByInvoiceId,
  generateNextReferenceNumber,
  storePDFUrl,
  generateWhatsAppShareUrl
};
