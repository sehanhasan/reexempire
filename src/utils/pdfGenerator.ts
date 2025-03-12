
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuotationItem, InvoiceItem, DepositInfo } from '@/components/quotations/types';

// Common interface for both document types
interface DocumentDetails {
  documentNumber: string;
  documentDate: string;
  customerName: string;
  unitNumber?: string;
  expiryDate: string;
  notes: string;
  items: QuotationItem[] | InvoiceItem[];
  subject?: string;
}

// Specific interfaces
interface QuotationDetails extends DocumentDetails {
  validUntil: string;
  depositInfo: DepositInfo;
}

interface InvoiceDetails extends DocumentDetails {
  dueDate: string;
  paymentMethod: string;
  isDepositInvoice: boolean;
  depositAmount: number;
  depositPercentage: number;
  quotationReference?: string;
}

const formatCurrency = (amount: number): string => {
  return `RM ${amount.toFixed(2)}`;
};

const calculateSubtotal = (items: QuotationItem[] | InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + item.amount, 0);
};

const calculateTax = (subtotal: number): number => {
  return subtotal * 0.06; // 6% SST in Malaysia
};

const calculateTotal = (subtotal: number): number => {
  return subtotal + calculateTax(subtotal);
};

// Base PDF generation function
const generateBasePDF = (title: string): jsPDF => {
  const pdf = new jsPDF();
  
  // Add company logo/header
  pdf.setFillColor(59, 130, 246); // Blue color
  pdf.rect(0, 0, pdf.internal.pageSize.width, 30, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.text('STAR RESIDENCES', 15, 15);
  
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text(title, 15, 40);
  
  // Add company info
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text([
    'Star Residences Management',
    'Jalan Yap Kwan Seng, 50450 Kuala Lumpur',
    'Phone: +603-2168-1688',
    'Email: info@starresidences.com.my',
  ], 15, 50);
  
  return pdf;
};

// Generate a quotation PDF
export const generateQuotationPDF = (details: QuotationDetails): jsPDF => {
  const pdf = generateBasePDF('QUOTATION');
  const subtotal = calculateSubtotal(details.items);
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal);
  
  // Add quotation details
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('QUOTATION DETAILS', 15, 75);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text([
    `Quotation #: ${details.documentNumber}`,
    `Date: ${details.documentDate}`,
    `Valid Until: ${details.validUntil}`,
  ], 15, 85);
  
  // Add customer details
  pdf.setFont('helvetica', 'bold');
  pdf.text('CUSTOMER DETAILS', 120, 75);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text([
    `Customer: ${details.customerName}`,
    details.unitNumber ? `Unit #: ${details.unitNumber}` : '',
  ], 120, 85);

  // Add subject if available
  if (details.subject) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('SUBJECT', 15, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.text(details.subject, 15, 115);
    
    // Start items table lower if subject exists
    addItemsTable(pdf, details.items, 125);
  } else {
    addItemsTable(pdf, details.items, 105);
  }
  
  // Get the final Y position after the table
  // @ts-ignore - lastAutoTable is added by the plugin but not in the type definition
  const tableEndY = pdf.lastAutoTable?.finalY || 200;
  
  pdf.setFontSize(11);
  
  pdf.text(`Subtotal:`, 140, tableEndY + 10);
  pdf.text(formatCurrency(subtotal), 170, tableEndY + 10, { align: 'right' });
  
  pdf.text(`SST (6%):`, 140, tableEndY + 20);
  pdf.text(formatCurrency(tax), 170, tableEndY + 20, { align: 'right' });
  
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Total:`, 140, tableEndY + 30);
  pdf.text(formatCurrency(total), 170, tableEndY + 30, { align: 'right' });
  
  // Add deposit information if required
  if (details.depositInfo.requiresDeposit) {
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Deposit (${details.depositInfo.depositPercentage}%):`, 140, tableEndY + 40);
    pdf.text(formatCurrency(details.depositInfo.depositAmount), 170, tableEndY + 40, { align: 'right' });
    
    pdf.text(`Balance Due:`, 140, tableEndY + 50);
    pdf.text(formatCurrency(total - details.depositInfo.depositAmount), 170, tableEndY + 50, { align: 'right' });
  }
  
  // Add notes
  if (details.notes) {
    const notesY = details.depositInfo.requiresDeposit ? tableEndY + 70 : tableEndY + 50;
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOTES', 15, notesY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    // Split notes into multiple lines if needed
    const splitNotes = pdf.splitTextToSize(details.notes, 180);
    pdf.text(splitNotes, 15, notesY + 10);
  }
  
  // Add footer
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Thank you for your business!', pdf.internal.pageSize.width / 2, pageHeight - 20, { align: 'center' });
  
  return pdf;
};

// Generate an invoice PDF
export const generateInvoicePDF = (details: InvoiceDetails): jsPDF => {
  const pdf = generateBasePDF('INVOICE');
  let subtotal = calculateSubtotal(details.items);
  let taxableAmount = subtotal;
  
  // If this is a deposit invoice, only calculate tax on the deposit amount
  if (details.isDepositInvoice) {
    taxableAmount = details.depositAmount;
  }
  
  const tax = calculateTax(taxableAmount);
  const total = details.isDepositInvoice ? details.depositAmount + tax : subtotal + tax;
  
  // Add invoice details
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE DETAILS', 15, 75);
  
  pdf.setFont('helvetica', 'normal');
  const invoiceDetails = [
    `Invoice #: ${details.documentNumber}`,
    `Date: ${details.documentDate}`,
    `Due Date: ${details.dueDate}`,
    `Payment Method: ${details.paymentMethod.replace('_', ' ').toUpperCase()}`
  ];
  
  if (details.quotationReference) {
    invoiceDetails.push(`Quotation Ref: ${details.quotationReference}`);
  }
  
  if (details.isDepositInvoice) {
    invoiceDetails.push(`Deposit Invoice (${details.depositPercentage}%)`);
  }
  
  pdf.text(invoiceDetails, 15, 85);
  
  // Add customer details
  pdf.setFont('helvetica', 'bold');
  pdf.text('CUSTOMER DETAILS', 120, 75);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text([
    `Customer: ${details.customerName}`,
    details.unitNumber ? `Unit #: ${details.unitNumber}` : '',
  ], 120, 85);

  // Add subject if available
  if (details.subject) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('SUBJECT', 15, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.text(details.subject, 15, 115);
    
    // Start items table lower if subject exists
    addItemsTable(pdf, details.items, 125);
  } else {
    addItemsTable(pdf, details.items, 105);
  }
  
  // Get the final Y position after the table
  // @ts-ignore - lastAutoTable is added by the plugin but not in the type definition
  const tableEndY = pdf.lastAutoTable?.finalY || 200;
  
  pdf.setFontSize(11);
  
  pdf.text(`Subtotal:`, 140, tableEndY + 10);
  pdf.text(formatCurrency(subtotal), 170, tableEndY + 10, { align: 'right' });
  
  // Add deposit calculation if it's a deposit invoice
  if (details.isDepositInvoice) {
    pdf.text(`Deposit (${details.depositPercentage}%):`, 140, tableEndY + 20);
    pdf.text(formatCurrency(details.depositAmount), 170, tableEndY + 20, { align: 'right' });
    
    pdf.text(`Balance Due (Future Invoice):`, 140, tableEndY + 30);
    pdf.text(formatCurrency(subtotal - details.depositAmount), 170, tableEndY + 30, { align: 'right' });
    
    pdf.text(`SST (6%) on Deposit:`, 140, tableEndY + 40);
    pdf.text(formatCurrency(tax), 170, tableEndY + 40, { align: 'right' });
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total Due Now:`, 140, tableEndY + 50);
    pdf.text(formatCurrency(total), 170, tableEndY + 50, { align: 'right' });
  } else {
    pdf.text(`SST (6%):`, 140, tableEndY + 20);
    pdf.text(formatCurrency(tax), 170, tableEndY + 20, { align: 'right' });
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total Due:`, 140, tableEndY + 30);
    pdf.text(formatCurrency(total), 170, tableEndY + 30, { align: 'right' });
  }
  
  // Add notes
  if (details.notes) {
    const notesY = details.isDepositInvoice ? tableEndY + 70 : tableEndY + 50;
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOTES', 15, notesY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    // Split notes into multiple lines if needed
    const splitNotes = pdf.splitTextToSize(details.notes, 180);
    pdf.text(splitNotes, 15, notesY + 10);
  }
  
  // Add footer
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Thank you for your business!', pdf.internal.pageSize.width / 2, pageHeight - 20, { align: 'center' });
  
  return pdf;
};

// Helper function to add items table
const addItemsTable = (pdf: jsPDF, items: QuotationItem[] | InvoiceItem[], startY: number): void => {
  const tableHeaders = [
    { header: 'Description', dataKey: 'description' },
    { header: 'Quantity', dataKey: 'quantity' },
    { header: 'Unit', dataKey: 'unit' },
    { header: 'Unit Price (RM)', dataKey: 'unitPrice' },
    { header: 'Amount (RM)', dataKey: 'amount' }
  ];
  
  const tableData = items.map(item => ({
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice.toFixed(2),
    amount: item.amount.toFixed(2)
  }));
  
  autoTable(pdf, {
    startY: startY,
    head: [tableHeaders.map(h => h.header)],
    body: tableData.map(item => [
      item.description,
      item.quantity,
      item.unit,
      item.unitPrice,
      item.amount
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [82, 117, 180],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    didParseCell: (data) => {
      // Align numeric columns to the right
      if (data.column.index > 2) {
        data.cell.styles.halign = 'right';
      }
    }
  });
};

// Function to download the PDF
export const downloadPDF = (pdf: jsPDF, filename: string): void => {
  pdf.save(filename);
};
