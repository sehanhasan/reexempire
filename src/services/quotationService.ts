
import { supabase } from "@/integrations/supabase/client";
import { Quotation, QuotationItem as DBQuotationItem, Customer } from "@/types/database";

interface QuotationItemInput {
  quotation_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  category?: string;
}

interface QuotationInput {
  customer_id: string;
  reference_number: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  subtotal: number;
  total: number;
  notes?: string | null;
  terms?: string | null;
  subject?: string | null;
  requires_deposit?: boolean;
  deposit_amount?: number;
  deposit_percentage?: number;
}

const getAll = async (): Promise<Quotation[]> => {
  const { data, error } = await supabase
    .from('quotations')
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

const getById = async (id: string): Promise<Quotation | null> => {
  const { data, error } = await supabase
    .from('quotations')
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

const create = async (quotation: QuotationInput): Promise<Quotation> => {
  const { data, error } = await supabase
    .from('quotations')
    .insert([quotation])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const update = async (id: string, quotation: Partial<QuotationInput>): Promise<Quotation> => {
  const { data, error } = await supabase
    .from('quotations')
    .update(quotation)
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
    .from('quotations')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};

const getItemsByQuotationId = async (quotationId: string): Promise<DBQuotationItem[]> => {
  const { data, error } = await supabase
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', quotationId)
    .order('display_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};

const createItem = async (item: QuotationItemInput): Promise<DBQuotationItem> => {
  const { data, error } = await supabase
    .from('quotation_items')
    .insert([item])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const deleteAllItems = async (quotationId: string): Promise<void> => {
  const { error } = await supabase
    .from('quotation_items')
    .delete()
    .eq('quotation_id', quotationId);

  if (error) {
    throw error;
  }
};

const generateNextReferenceNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `QUO${currentYear}`;

  const { data, error } = await supabase
    .from('quotations')
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

const storePDFUrl = async (quotationId: string, pdfUrl: string): Promise<void> => {
  const { error } = await supabase
    .from('quotations')
    .update({ pdf_url: pdfUrl })
    .eq('id', quotationId);

  if (error) {
    throw error;
  }
};

const generateWhatsAppShareUrl = (quotationId: string, quotationNumber: string, customerName: string, quotationUrl: string): string => {
  // Use permanent public URLs based on environment
  const baseUrl = window.location.hostname.includes('lovable.app') 
    ? 'https://reexempire.lovable.app'
    : window.location.origin;
  
  const fullQuotationUrl = `${baseUrl}/quotations/view/${quotationId}`;
  
  const message = `Dear ${customerName},\n\n` +
    `Please find your quotation ${quotationNumber} for review at the link below: ` +
    `${fullQuotationUrl}\n\n` +
    `You can review the quotation details and accept or request changes.\n\n` +
    `If you have any questions, please don't hesitate to contact us.\n\n` +
    `Thank you,\nReex Empire Sdn Bhd`;
  
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

export const quotationService = {
  getAll,
  getById,
  create,
  update,
  remove,
  getItemsByQuotationId,
  createItem,
  deleteAllItems,
  generateNextReferenceNumber,
  storePDFUrl,
  generateWhatsAppShareUrl
};
