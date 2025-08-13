import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';

export interface ItemBase {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  category?: string;
}

export interface QuotationDetails {
  documentNumber: string;
  documentDate: string;
  customerName: string;
  customerAddress: string;
  customerContact: string;
  customerEmail: string;
  unitNumber: string;
  expiryDate: string;
  validUntil: string;
  subject: string;
  notes: string;
  items: ItemBase[];
  depositInfo: {
    requiresDeposit: boolean;
    depositAmount: number;
    depositPercentage: number;
  };
}

export interface InvoiceDetails {
  documentNumber: string;
  documentDate: string;
  dueDate: string;
  customerName: string;
  customerAddress: string;
  customerContact: string;
  customerEmail: string;
  unitNumber: string;
  subject: string;
  notes: string;
  items: ItemBase[];
  quotationRefNumber?: string;
}

const addCompanyHeader = (doc: jsPDF) => {
  // Company logo and header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('REEX EMPIRE SDN BHD', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SSM: 202301043078 (1529078-A)', 20, 32);
  doc.text('No. 53, Jalan Ros Merah 2/16, Taman Johor Jaya,', 20, 38);
  doc.text('81100 Johor Bahru, Johor', 20, 44);
  doc.text('Tel: +6017-716 2628', 20, 50);
  doc.text('Email: reexempire@gmail.com', 20, 56);
  
  // Add a line separator
  doc.setLineWidth(0.5);
  doc.line(20, 65, 190, 65);
};

const addCustomerInfo = (doc: jsPDF, details: QuotationDetails | InvoiceDetails, startY: number) => {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, startY);
  
  doc.setFont('helvetica', 'normal');
  let currentY = startY + 8;
  doc.text(details.customerName, 20, currentY);
  
  if (details.customerAddress) {
    currentY += 6;
    const addressLines = doc.splitTextToSize(details.customerAddress, 80);
    doc.text(addressLines, 20, currentY);
    currentY += addressLines.length * 6;
  }
  
  if (details.customerContact) {
    currentY += 6;
    doc.text(`Phone: ${details.customerContact}`, 20, currentY);
  }
  
  if (details.customerEmail) {
    currentY += 6;
    doc.text(`Email: ${details.customerEmail}`, 20, currentY);
  }
  
  return currentY + 10;
};

const addDocumentInfo = (doc: jsPDF, details: QuotationDetails | InvoiceDetails, docType: 'quotation' | 'invoice', startY: number) => {
  const isQuotation = docType === 'quotation';
  const quotationDetails = details as QuotationDetails;
  const invoiceDetails = details as InvoiceDetails;
  
  doc.setFont('helvetica', 'bold');
  doc.text(`${isQuotation ? 'Quotation' : 'Invoice'} #:`, 120, startY);
  doc.text(`${isQuotation ? 'Quotation' : 'Invoice'} Date:`, 120, startY + 8);
  
  if (isQuotation) {
    doc.text('Valid Until:', 120, startY + 16);
  } else {
    doc.text('Due Date:', 120, startY + 16);
  }
  
  if (!isQuotation && invoiceDetails.quotationRefNumber) {
    doc.text('Quotation Ref:', 120, startY + 24);
  }
  
  doc.setFont('helvetica', 'normal');
  doc.text(details.documentNumber, 160, startY);
  doc.text(details.documentDate, 160, startY + 8);
  
  if (isQuotation) {
    doc.text(quotationDetails.validUntil, 160, startY + 16);
  } else {
    doc.text(invoiceDetails.dueDate, 160, startY + 16);
  }
  
  if (!isQuotation && invoiceDetails.quotationRefNumber) {
    doc.text(invoiceDetails.quotationRefNumber, 160, startY + 24);
  }
  
  return startY + ((!isQuotation && invoiceDetails.quotationRefNumber) ? 32 : 24);
};

const addItemsTable = (doc: jsPDF, items: ItemBase[], startY: number) => {
  const tableData = items.map(item => [
    item.description,
    item.quantity.toString(),
    item.unit,
    `RM ${item.unitPrice.toFixed(2)}`,
    `RM ${item.amount.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    head: [['Description', 'Qty', 'Unit', 'Unit Price', 'Amount']],
    body: tableData,
    startY: startY,
    theme: 'grid',
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: 20, right: 20 },
  });
  
  return (doc as any).lastAutoTable.finalY + 10;
};

const addTotals = (doc: jsPDF, items: ItemBase[], startY: number, depositInfo?: QuotationDetails['depositInfo']) => {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', 140, startY);
  doc.text(`RM ${subtotal.toFixed(2)}`, 175, startY, { align: 'right' });
  
  let currentY = startY + 8;
  
  if (depositInfo?.requiresDeposit) {
    doc.text('Deposit Required:', 140, currentY);
    doc.text(`RM ${depositInfo.depositAmount.toFixed(2)}`, 175, currentY, { align: 'right' });
    currentY += 8;
  }
  
  doc.setFontSize(12);
  doc.text('Total:', 140, currentY);
  doc.text(`RM ${subtotal.toFixed(2)}`, 175, currentY, { align: 'right' });
  
  return currentY + 15;
};

const addFooter = (doc: jsPDF, notes: string, startY: number) => {
  if (notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, startY);
    
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(notes, 170);
    doc.text(noteLines, 20, startY + 8);
    
    startY += 8 + (noteLines.length * 6) + 10;
  }
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', 20, startY);
  
  return startY;
};

export const generateQuotationPDF = async (details: QuotationDetails): Promise<string> => {
  const doc = new jsPDF();
  
  // Add company header
  addCompanyHeader(doc);
  
  // Add document title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', 105, 80, { align: 'center' });
  
  // Add subject if provided
  let currentY = 90;
  if (details.subject) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subject: ${details.subject}`, 20, currentY);
    currentY += 10;
  }
  
  // Add customer info
  currentY = addCustomerInfo(doc, details, currentY + 5);
  
  // Add document info
  addDocumentInfo(doc, details, 'quotation', currentY - 35);
  
  // Add items table
  currentY = addItemsTable(doc, details.items, currentY + 10);
  
  // Add totals
  currentY = addTotals(doc, details.items, currentY, details.depositInfo);
  
  // Add footer
  addFooter(doc, details.notes, currentY);
  
  // Generate PDF blob and upload to storage
  const pdfBlob = doc.output('blob');
  const fileName = `quotation-${details.documentNumber}-${Date.now()}.pdf`;
  
  try {
    // Upload to Supabase storage using public bucket
    const { data, error } = await supabase.storage
      .from('payment-receipts') // Using existing public bucket
      .upload(`pdfs/${fileName}`, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    }

    // Get permanent public URL
    const { data: urlData } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(`pdfs/${fileName}`);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error generating PDF URL:', error);
    throw error;
  }
};

export const generateInvoicePDF = async (details: InvoiceDetails): Promise<string> => {
  const doc = new jsPDF();
  
  // Add company header
  addCompanyHeader(doc);
  
  // Add document title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 105, 80, { align: 'center' });
  
  // Add subject if provided
  let currentY = 90;
  if (details.subject) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subject: ${details.subject}`, 20, currentY);
    currentY += 10;
  }
  
  // Add customer info
  currentY = addCustomerInfo(doc, details, currentY + 5);
  
  // Add document info
  addDocumentInfo(doc, details, 'invoice', currentY - 35);
  
  // Add items table
  currentY = addItemsTable(doc, details.items, currentY + 10);
  
  // Add totals
  currentY = addTotals(doc, details.items, currentY);
  
  // Add footer
  addFooter(doc, details.notes, currentY);
  
  // Generate PDF blob and upload to storage
  const pdfBlob = doc.output('blob');
  const fileName = `invoice-${details.documentNumber}-${Date.now()}.pdf`;
  
  try {
    // Upload to Supabase storage using public bucket
    const { data, error } = await supabase.storage
      .from('payment-receipts') // Using existing public bucket
      .upload(`pdfs/${fileName}`, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    }

    // Get permanent public URL
    const { data: urlData } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(`pdfs/${fileName}`);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error generating PDF URL:', error);
    throw error;
  }
};

// Add downloadPDF function for backward compatibility
export const downloadPDF = async (type: 'quotation' | 'invoice', details: QuotationDetails | InvoiceDetails): Promise<string> => {
  if (type === 'quotation') {
    return generateQuotationPDF(details as QuotationDetails);
  } else {
    return generateInvoicePDF(details as InvoiceDetails);
  }
};
