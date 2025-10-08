import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceImage } from "@/types/database";

const generateUniqueReferenceNumber = async (isDepositInvoice: boolean = false): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  
  let counter = 1691;
  let referenceNumber: string;
  
  do {
    const sequence = counter.toString().padStart(5, '0');
    referenceNumber = isDepositInvoice 
      ? `INV-${year}-${sequence}-D`
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
    } else {
      // Enforce suffix rules based on invoice type
      if (invoiceData.is_deposit_invoice) {
        // Remove any existing suffix then ensure -D
        invoiceData.reference_number = invoiceData.reference_number.replace(/-[A-Z]$/i, '');
        if (!invoiceData.reference_number.endsWith('-D')) {
          invoiceData.reference_number = `${invoiceData.reference_number}-D`;
        }
      } else {
        // Normal invoices should not carry deposit/due suffixes
        invoiceData.reference_number = invoiceData.reference_number.replace(/-[A-Z]$/i, '');
      }
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

    // Generate next sequential reference number for due invoice based on deposit invoice's sequence
    const now = new Date();
    const year = now.getFullYear();
    
    // Parse deposit invoice reference and increment sequence by 1
    const parseResult = depositInvoice.reference_number?.match(/^INV-(\d{4})-(\d{4})(?:-[A-Z])?$/);
    let seq = 1;
    if (parseResult) {
      const refYear = parseInt(parseResult[1], 10);
      const refSeq = parseInt(parseResult[2], 10);
      seq = refYear === year ? refSeq + 1 : 1;
    }
    
    // Ensure uniqueness by incrementing until no collision
    let dueReferenceNumber = `INV-${year}-${seq.toString().padStart(4, '0')}-F`;
    while (true) {
      const { data: existing, error: checkError } = await supabase
        .from('invoices')
        .select('id')
        .eq('reference_number', dueReferenceNumber)
        .maybeSingle();
      
      if (checkError) {
        console.error('InvoiceService: Error checking due invoice ref:', checkError);
        throw new Error(`Error checking due invoice reference: ${checkError.message}`);
      }
      
      if (!existing) break;
      seq += 1;
      dueReferenceNumber = `INV-${year}-${seq.toString().padStart(4, '0')}-F`;
    }

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
    
    // If updating payment status to "Paid" for a deposit invoice, change it to "Partially Paid"
    if (updates.payment_status === 'Paid') {
      const currentInvoice = await getById(id);
      if (currentInvoice?.is_deposit_invoice) {
        updates.payment_status = 'Partially Paid';
      }
    }
    
    // If status is being changed to "Sent", create warranty items for warranty category items
    if (updates.status === 'Sent') {
      const currentInvoice = await getById(id);
      if (currentInvoice) {
        // Get invoice items with warranty category
        const invoiceItems = await getItemsByInvoiceId(id);
        const warrantyItems = invoiceItems.filter(item => 
          item.category === 'Warranty Items' && 
          item.description && 
          item.description.includes('Warranty:')
        );

        // Create warranty items for each warranty category item
        for (const item of warrantyItems) {
          try {
            // Parse warranty information from description
            const nameMatch = item.description.match(/^([^(]+?)(?:\s*-\s*#([^)]+))?\s*\(Warranty:\s*([^)]+)\)/);
            if (nameMatch) {
              const itemName = nameMatch[1].trim();
              const serialNumber = nameMatch[2] || '';
              const warrantyPeriod = nameMatch[3].trim();
              
              // Convert warranty period text to type
              let warrantyPeriodType = '30_days';
              switch (warrantyPeriod) {
                case '7 Days':
                  warrantyPeriodType = '7_days';
                  break;
                case '30 Days':
                  warrantyPeriodType = '30_days';
                  break;
                case '3 Months':
                  warrantyPeriodType = '3_months';
                  break;
                case '6 Months':
                  warrantyPeriodType = '6_months';
                  break;
                case '1 Year':
                  warrantyPeriodType = '1_year';
                  break;
              }

              // Calculate expiry date
              const issueDate = new Date(currentInvoice.issue_date);
              let expiryDate = new Date(issueDate);
              
              switch (warrantyPeriodType) {
                case '7_days':
                  expiryDate.setDate(expiryDate.getDate() + 7);
                  break;
                case '30_days':
                  expiryDate.setDate(expiryDate.getDate() + 30);
                  break;
                case '3_months':
                  expiryDate.setMonth(expiryDate.getMonth() + 3);
                  break;
                case '6_months':
                  expiryDate.setMonth(expiryDate.getMonth() + 6);
                  break;
                case '1_year':
                  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                  break;
              }

              // Create warranty item record with quantity
              const warrantyData = {
                customer_id: currentInvoice.customer_id,
                invoice_id: id,
                item_name: itemName,
                serial_number: serialNumber || null,
                issue_date: currentInvoice.issue_date,
                warranty_period_type: warrantyPeriodType,
                warranty_period_value: null,
                warranty_period_unit: null,
                expiry_date: expiryDate.toISOString().split('T')[0],
                quantity: item.quantity || 1
              };

              const { data: warrantyItem, error: warrantyError } = await supabase
                .from('warranty_items')
                .insert([warrantyData])
                .select()
                .single();

              if (warrantyError) {
                console.error('InvoiceService: Error creating warranty item:', warrantyError);
              } else {
                console.log('InvoiceService: Created warranty item for:', itemName);
                
                // Update inventory quantity - find matching inventory item
                const { data: inventoryItems } = await supabase
                  .from('inventory_items')
                  .select('*')
                  .eq('name', itemName)
                  .maybeSingle();

                if (inventoryItems) {
                  // Create inventory movement for OUT
                  await supabase
                    .from('inventory_movements')
                    .insert([{
                      inventory_item_id: inventoryItems.id,
                      quantity: item.quantity || 1,
                      movement_type: 'OUT',
                      reference_type: 'warranty',
                      reference_id: warrantyItem.id,
                      notes: `Warranty item added from invoice ${currentInvoice.reference_number}`,
                      created_by: 'system'
                    }]);
                  
                  console.log('InvoiceService: Updated inventory for warranty item:', itemName);
                }
              }
            }
          } catch (warrantyError) {
            console.error('InvoiceService: Error processing warranty item:', warrantyError);
          }
        }
      }
    }
    
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
    
    // Get warranty items associated with this invoice to restore inventory
    const { data: warrantyItems } = await supabase
      .from('warranty_items')
      .select('*')
      .eq('invoice_id', id);

    if (warrantyItems && warrantyItems.length > 0) {
      console.log(`InvoiceService: Found ${warrantyItems.length} warranty items to process`);
      
      for (const warrantyItem of warrantyItems) {
        try {
          // Find matching inventory item
          const { data: inventoryItem } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('name', warrantyItem.item_name)
            .maybeSingle();

          if (inventoryItem) {
            // Create inventory movement to return items to stock
            await supabase
              .from('inventory_movements')
              .insert([{
                inventory_item_id: inventoryItem.id,
                quantity: warrantyItem.quantity || 1,
                movement_type: 'IN',
                reference_type: 'warranty_return',
                reference_id: warrantyItem.id,
                notes: `Returned to inventory from deleted invoice`,
                created_by: 'system'
              }]);
            
            console.log(`InvoiceService: Restored inventory for: ${warrantyItem.item_name}`);
          }

          // Delete the warranty item
          await supabase
            .from('warranty_items')
            .delete()
            .eq('id', warrantyItem.id);
            
        } catch (warrantyError) {
          console.error('InvoiceService: Error processing warranty item:', warrantyError);
        }
      }
    }
    
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
  generateWhatsAppShareUrl
};

export default invoiceService;
