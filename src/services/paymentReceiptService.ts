
import { supabase } from "@/integrations/supabase/client";

export interface PaymentReceipt {
  id: string;
  invoice_id: string;
  receipt_url: string;
  original_filename: string | null;
  uploaded_at: string;
  customer_notes: string | null;
  status: string;
}

const getReceiptsByInvoiceId = async (invoiceId: string): Promise<PaymentReceipt[]> => {
  const { data, error } = await supabase
    .from('invoice_payment_receipts')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

const uploadReceipt = async (
  invoiceId: string,
  file: File,
  customerNotes?: string
): Promise<PaymentReceipt> => {
  // Sanitize file name
  const sanitizedFileName = file.name
    .replace(/\s+/g, '_')
    .replace(/[^\w\-_.]/g, '')
    .replace(/_{2,}/g, '_')
    .toLowerCase();

  const fileName = `${invoiceId}/${Date.now()}-${sanitizedFileName}`;

  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('payment-receipts')
    .upload(fileName, file);

  if (uploadError) {
    throw uploadError;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('payment-receipts')
    .getPublicUrl(uploadData.path);

  // Save receipt record to database
  const { data, error } = await supabase
    .from('invoice_payment_receipts')
    .insert([{
      invoice_id: invoiceId,
      receipt_url: urlData.publicUrl,
      original_filename: file.name,
      customer_notes: customerNotes || null
    }])
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const paymentReceiptService = {
  getReceiptsByInvoiceId,
  uploadReceipt
};
