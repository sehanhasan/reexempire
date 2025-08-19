import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceImage } from "@/types/database";

const generateUniqueReferenceNumber = async (isDepositInvoice: boolean = false): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  
  let counter = 1;
  let referenceNumber: string;
  
  do {
    const sequence = counter.toString().padStart(4, '0');
    referenceNumber = isDepositInvoice 
      ? `INV-${year}-${sequence}-A`
      : `INV-${year}-${sequence}`;
    
    console.log(`InvoiceService: Checking reference number: ${referenceNumber}`);
    
    // Check if this reference number already exists
    const { data, error } = await supabase
      .from("invoices")
      .select("id")
      .eq("reference_number", referenceNumber)
      .maybeSingle();
    
    if (error) {
      console.error("InvoiceService: Error checking reference number:", error);
      throw new Error(`Error checking reference number: ${error.message}`);
    }
    
    if (!data) {
      // Reference number is unique
      console.log(`InvoiceService: Found unique reference number: ${referenceNumber}`);
      break;
    }
    
    counter++;
  } while (counter <= 9999); // Prevent infinite loop
  
  if (counter > 9999) {
    throw new Error("Unable to generate unique reference number - sequence exhausted");
  }
  
  return referenceNumber;
};

const getAll = async (): Promise<Invoice[]> => {
  try {
    console.log("InvoiceService: Fetching all invoices...");
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("InvoiceService: Error fetching invoices:", error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    console.log("InvoiceService: Successfully fetched invoices:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("InvoiceService: Unexpected error in getAll:", error);
    throw error;
  }
};

const getById = async (id: string): Promise<Invoice | null> => {
  try {
    console.log(`InvoiceService: Fetching invoice with id ${id}...`);
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`InvoiceService: Error fetching invoice with id ${id}:`, error);
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }

    console.log(`InvoiceService: Successfully fetched invoice:`, data);
    return data || null;
  } catch (error) {
    console.error(`InvoiceService: Unexpected error in getById:`, error);
    throw error;
  }
};

const create = async (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> => {
  try {
    console.log("InvoiceService: Creating invoice with data:", invoice);
    
    // Generate unique reference number if not provided
    let invoiceData = { ...invoice };
    if (!invoiceData.reference_number) {
      invoiceData.reference_number = await generateUniqueReferenceNumber(invoiceData.is_deposit_invoice || false);
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select('*')
      .single();

    if (error) {
      console.error("InvoiceService: Error creating invoice:", error);
      
      // If it's a duplicate reference number error, try generating a new one
      if (error.code === '23505' && error.message.includes('reference_number')) {
        console.log("InvoiceService: Duplicate reference number detected, generating new one...");
        invoiceData.reference_number = await generateUniqueReferenceNumber(invoiceData.is_deposit_invoice || false);
        
        const { data: retryData, error: retryError } = await supabase
          .from('invoices')
          .insert([invoiceData])
          .select('*')
          .single();
          
        if (retryError) {
          console.error("InvoiceService: Error creating invoice on retry:", retryError);
          throw new Error(`Failed to create invoice: ${retryError.message}`);
        }
        
        console.log("InvoiceService: Successfully created invoice on retry:", retryData);
        return retryData;
      }
      
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    console.log("InvoiceService: Successfully created invoice:", data);
    return data;
  } catch (error) {
    console.error("InvoiceService: Unexpected error in create:", error);
    throw error;
  }
};

const createDueInvoiceFromDeposit = async (depositInvoiceId: string): Promise<Invoice> => {
  try {
    console.log(`InvoiceService: Creating due invoice for deposit invoice ${depositInvoiceId}`);
    
    // Get the original deposit invoice
    const depositInvoice = await getById(depositInvoiceId);
    if (!depositInvoice) {
      throw new Error("Deposit invoice not found");
    }
    
    if (!depositInvoice.is_deposit_invoice) {
      throw new Error("Invoice is not a deposit invoice");
    }

    // Calculate the due amount (total - deposit amount)
    const depositAmount = Number(depositInvoice.deposit_amount || 0);
    const totalAmount = Number(depositInvoice.subtotal || 0);
    const dueAmount = totalAmount - depositAmount;

    if (dueAmount <= 0) {
      throw new Error("No due amount remaining for this deposit invoice");
    }

    // Create the due invoice with proper reference number format
    const baseRefNumber = depositInvoice.reference_number.replace('-A', '');
    const dueReferenceNumber = `${baseRefNumber}-B`;

    const dueInvoiceData = {
      quotation_id: depositInvoice.quotation_id,
      customer_id: depositInvoice.customer_id,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      subtotal: dueAmount,
      tax_rate: depositInvoice.tax_rate || 0,
      tax_amount: 0,
      total: dueAmount,
      is_deposit_invoice: false,
      deposit_amount: 0,
      deposit_percentage: 0,
      reference_number: dueReferenceNumber,
      status: 'Draft',
      notes: `Due amount for deposit invoice ${depositInvoice.reference_number}`,
      terms: depositInvoice.terms,
      payment_status: 'Unpaid',
      subject: `Due Payment - ${depositInvoice.subject || 'Invoice'}`,
      quotation_ref_number: depositInvoice.quotation_ref_number
    };

    // Calculate tax amount if tax rate is provided
    if (dueInvoiceData.tax_rate > 0) {
      dueInvoiceData.tax_amount = (dueAmount * dueInvoiceData.tax_rate) / 100;
      dueInvoiceData.total = dueAmount + dueInvoiceData.tax_amount;
    }

    const dueInvoice = await create(dueInvoiceData);
    
    // Copy invoice items from the original deposit invoice
    const depositItems = await getItemsByInvoiceId(depositInvoiceId);
    
    for (const item of depositItems) {
      // Calculate proportional amounts for the due invoice
      const proportionalAmount = (item.amount / totalAmount) * dueAmount;
      
      await createItem({
        invoice_id: dueInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        amount: proportionalAmount,
        category: item.category,
        display_order: item.display_order
      });
    }

    console.log("InvoiceService: Successfully created due invoice:", dueInvoice);
    return dueInvoice;
  } catch (error) {
    console.error("InvoiceService: Error creating due invoice:", error);
    throw error;
  }
};

const update = async (id: string, updates: Partial<Invoice>): Promise<Invoice | null> => {
  try {
    console.log(`InvoiceService: Updating invoice ${id} with:`, updates);
    
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(`InvoiceService: Error updating invoice with id ${id}:`, error);
      throw new Error(`Failed to update invoice: ${error.message}`);
    }

    console.log(`InvoiceService: Successfully updated invoice:`, data);
    return data || null;
  } catch (error) {
    console.error(`InvoiceService: Unexpected error in update:`, error);
    throw error;
  }
};

const deleteInvoice = async (id: string): Promise<void> => {
  try {
    console.log(`InvoiceService: Deleting invoice with id ${id}`);
    
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`InvoiceService: Error deleting invoice with id ${id}:`, error);
      throw new Error(`Failed to delete invoice: ${error.message}`);
    }

    console.log(`InvoiceService: Successfully deleted invoice with id ${id}`);
  } catch (error) {
    console.error(`InvoiceService: Unexpected error in delete:`, error);
    throw error;
  }
};

const getItemsByInvoiceId = async (invoiceId: string) => {
  try {
    console.log(`InvoiceService: Fetching items for invoice ${invoiceId}`);
    
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);

    if (error) {
      console.error(`InvoiceService: Error fetching items for invoice ${invoiceId}:`, error);
      throw new Error(`Failed to fetch invoice items: ${error.message}`);
    }

    console.log(`InvoiceService: Successfully fetched ${data?.length || 0} items for invoice ${invoiceId}`);
    return data;
  } catch (error) {
    console.error(`InvoiceService: Unexpected error in getItemsByInvoiceId:`, error);
    throw error;
  }
};

const createItem = async (item: any) => {
  try {
    console.log("InvoiceService: Creating invoice item:", item);
    
    const { data, error } = await supabase
      .from('invoice_items')
      .insert([item])
      .select('*')
      .single();

    if (error) {
      console.error("InvoiceService: Error creating invoice item:", error);
      throw new Error(`Failed to create invoice item: ${error.message}`);
    }

    console.log("InvoiceService: Successfully created invoice item:", data);
    return data;
  } catch (error) {
    console.error("InvoiceService: Unexpected error in createItem:", error);
    throw error;
  }
};

const updateItem = async (id: string, updates: any) => {
  try {
    console.log(`InvoiceService: Updating invoice item ${id} with:`, updates);
    
    const { data, error } = await supabase
      .from('invoice_items')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(`InvoiceService: Error updating invoice item with id ${id}:`, error);
      throw new Error(`Failed to update invoice item: ${error.message}`);
    }

    console.log(`InvoiceService: Successfully updated invoice item:`, data);
    return data;
  } catch (error) {
    console.error(`InvoiceService: Unexpected error in updateItem:`, error);
    throw error;
  }
};

const deleteItem = async (id: string) => {
  try {
    console.log(`InvoiceService: Deleting invoice item with id ${id}`);
    
    const { error } = await supabase
      .from('invoice_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`InvoiceService: Error deleting invoice item with id ${id}:`, error);
      throw new Error(`Failed to delete invoice item: ${error.message}`);
    }

    console.log(`InvoiceService: Successfully deleted invoice item with id ${id}`);
  } catch (error) {
    console.error(`InvoiceService: Unexpected error in deleteItem:`, error);
    throw error;
  }
};

const addInvoiceImage = async (invoiceId: string, imageUrl: string) => {
  try {
    console.log(`InvoiceService: Adding image for invoice ${invoiceId}`);
    
    const { data, error } = await supabase
      .from('invoice_images')
      .insert([{
        invoice_id: invoiceId,
        image_url: imageUrl
      }])
      .select('*')
      .single();
    
    if (error) {
      console.error("InvoiceService: Error adding invoice image:", error);
      throw new Error(`Failed to add invoice image: ${error.message}`);
    }
    
    console.log("InvoiceService: Successfully added invoice image:", data);
    return data;
  } catch (error) {
    console.error("InvoiceService: Unexpected error in addInvoiceImage:", error);
    throw error;
  }
};

const getInvoiceImages = async (invoiceId: string): Promise<InvoiceImage[]> => {
  try {
    console.log(`InvoiceService: Fetching images for invoice ${invoiceId}`);
    
    const { data, error } = await supabase
      .from('invoice_images')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error(`InvoiceService: Error fetching images for invoice ${invoiceId}:`, error);
      throw new Error(`Failed to fetch invoice images: ${error.message}`);
    }
    
    console.log(`InvoiceService: Successfully fetched ${data?.length || 0} images for invoice ${invoiceId}`);
    return data || [];
  } catch (error) {
    console.error("InvoiceService: Unexpected error in getInvoiceImages:", error);
    throw error;
  }
};

const deleteItemsByInvoiceId = async (invoiceId: string): Promise<void> => {
  try {
    console.log(`InvoiceService: Deleting all items for invoice ${invoiceId}`);
    
    const { error } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId);

    if (error) {
      console.error(`InvoiceService: Error deleting items for invoice ${invoiceId}:`, error);
      throw new Error(`Failed to delete invoice items: ${error.message}`);
    }

    console.log(`InvoiceService: Successfully deleted all items for invoice ${invoiceId}`);
  } catch (error) {
    console.error("InvoiceService: Unexpected error in deleteItemsByInvoiceId:", error);
    throw error;
  }
};

const updateItems = async (invoiceId: string, items: any[]): Promise<void> => {
  try {
    console.log(`InvoiceService: Updating items for invoice ${invoiceId}`);
    
    // First, delete all existing items
    await deleteItemsByInvoiceId(invoiceId);
    
    // Then insert the new items
    if (items.length > 0) {
      const itemsToInsert = items.map((item, index) => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unit_price: Number(item.unitPrice),
        amount: Number(item.amount),
        category: item.category || null,
        display_order: index + 1
      }));

      const { error } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (error) {
        console.error(`InvoiceService: Error inserting items for invoice ${invoiceId}:`, error);
        throw new Error(`Failed to update invoice items: ${error.message}`);
      }
    }

    console.log(`InvoiceService: Successfully updated items for invoice ${invoiceId}`);
  } catch (error) {
    console.error("InvoiceService: Unexpected error in updateItems:", error);
    throw error;
  }
};

const generateWhatsAppShareUrl = (invoiceId: string, referenceNumber: string, customerName: string, invoiceUrl: string): string => {
  const message = `Invoice #${referenceNumber} for ${customerName}\n\nView: ${invoiceUrl}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?text=${encodedMessage}`;
};

export const invoiceService = {
  getAll,
  getById,
  create,
  createDueInvoiceFromDeposit,
  update,
  delete: deleteInvoice,
  getItemsByInvoiceId,
  createItem,
  updateItem,
  deleteItem,
  addInvoiceImage,
  getInvoiceImages,
  deleteItemsByInvoiceId,
  updateItems,
  generateWhatsAppShareUrl
};

export default invoiceService;
