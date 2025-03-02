
import { jsPDF } from "jspdf";
import { QuotationPDFData, InvoicePDFData } from "@/components/quotations/types";
import "jspdf-autotable";

// Add type definition for jspdf-autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return `RM ${amount.toFixed(2)}`;
};

// Generate PDF for Quotation
export const generateQuotationPDF = (data: QuotationPDFData) => {
  const doc = new jsPDF();
  
  // Add company header
  doc.setFontSize(20);
  doc.setTextColor(100, 100, 100);
  doc.text("RenovateProX", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("Professional Renovation Services", 14, 30);
  
  // Contact information
  doc.setFontSize(8);
  doc.text("123 Renovation Street, Kuala Lumpur, Malaysia", 14, 35);
  doc.text("Tel: +60 3-1234 5678 | Email: info@renovateprox.com", 14, 40);

  // Document title
  doc.setFontSize(16);
  doc.setTextColor(100, 100, 100);
  doc.text("QUOTATION", 14, 55);
  
  // Quotation information
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Left column - Customer info
  doc.text("Customer:", 14, 65);
  doc.text(data.customer, 45, 65);
  
  doc.text("Subject:", 14, 71);
  doc.text(data.subject, 45, 71);
  
  // Right column - Quotation details
  doc.text("Quotation #:", 120, 65);
  doc.text(data.quotationNumber, 155, 65);
  
  doc.text("Date:", 120, 71);
  doc.text(formatDate(data.quotationDate), 155, 71);
  
  doc.text("Valid Until:", 120, 77);
  doc.text(formatDate(data.validUntil), 155, 77);
  
  // Table for items
  const tableColumn = ["Description", "Qty", "Unit", "Unit Price", "Amount"];
  const tableRows = data.items.map(item => [
    item.category ? `${item.category} - ${item.description}` : item.description,
    item.quantity.toString(),
    item.unit,
    formatCurrency(item.unitPrice),
    formatCurrency(item.amount)
  ]);
  
  doc.autoTable({
    startY: 85,
    head: [tableColumn],
    body: tableRows,
    headStyles: { 
      fillColor: [155, 135, 245],
      textColor: [255, 255, 255]
    },
    alternateRowStyles: {
      fillColor: [240, 240, 250]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });
  
  // Add summary section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.text("Summary", 130, finalY);
  doc.line(130, finalY + 2, 180, finalY + 2);
  
  doc.text("Subtotal:", 130, finalY + 10);
  doc.text(formatCurrency(data.total), 180, finalY + 10, { align: "right" });
  
  if (data.depositInfo.requiresDeposit) {
    doc.text("Deposit Required:", 130, finalY + 17);
    doc.text(formatCurrency(data.depositInfo.depositAmount), 180, finalY + 17, { align: "right" });
    
    doc.text("Balance Due:", 130, finalY + 24);
    doc.text(formatCurrency(data.total - data.depositInfo.depositAmount), 180, finalY + 24, { align: "right" });
  }
  
  doc.setFontSize(12);
  doc.text("Total:", 130, finalY + (data.depositInfo.requiresDeposit ? 34 : 20));
  doc.setFontSize(12);
  doc.text(formatCurrency(data.total), 180, finalY + (data.depositInfo.requiresDeposit ? 34 : 20), { align: "right" });
  
  // Add notes section
  const notesY = finalY + (data.depositInfo.requiresDeposit ? 44 : 30);
  doc.setFontSize(10);
  doc.text("Notes:", 14, notesY);
  doc.setFontSize(9);
  const splitNotes = doc.splitTextToSize(data.notes || "Thank you for your business!", 180);
  doc.text(splitNotes, 14, notesY + 6);
  
  // Add terms and conditions
  const termsY = notesY + splitNotes.length * 6 + 10;
  doc.setFontSize(10);
  doc.text("Terms and Conditions:", 14, termsY);
  doc.setFontSize(8);
  doc.text("1. This quotation is valid for 30 days from the date of issue.", 14, termsY + 6);
  doc.text("2. Payment terms: 50% deposit upon acceptance, balance on completion.", 14, termsY + 12);
  doc.text("3. Work will commence within 7 days of deposit payment.", 14, termsY + 18);
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('RenovateProX Sdn Bhd | SSM: 123456-X | Generated on ' + new Date().toLocaleDateString(), 14, 290);
    doc.text('Page ' + i + ' of ' + pageCount, 180, 290, { align: 'right' });
  }
  
  // Save the PDF
  doc.save(`Quotation-${data.quotationNumber}.pdf`);
};

// Generate PDF for Invoice
export const generateInvoicePDF = (data: InvoicePDFData) => {
  const doc = new jsPDF();
  
  // Add company header
  doc.setFontSize(20);
  doc.setTextColor(100, 100, 100);
  doc.text("RenovateProX", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("Professional Renovation Services", 14, 30);
  
  // Contact information
  doc.setFontSize(8);
  doc.text("123 Renovation Street, Kuala Lumpur, Malaysia", 14, 35);
  doc.text("Tel: +60 3-1234 5678 | Email: info@renovateprox.com", 14, 40);

  // Document title
  doc.setFontSize(16);
  doc.setTextColor(100, 100, 100);
  doc.text(data.isDepositInvoice ? "DEPOSIT INVOICE" : "INVOICE", 14, 55);
  
  // Invoice information
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Left column - Customer info
  doc.text("Customer:", 14, 65);
  doc.text(data.customer, 45, 65);
  
  doc.text("Subject:", 14, 71);
  doc.text(data.subject, 45, 71);
  
  if (data.quotationReference) {
    doc.text("Reference:", 14, 77);
    doc.text(`Quotation #${data.quotationReference}`, 45, 77);
  }
  
  // Right column - Invoice details
  doc.text("Invoice #:", 120, 65);
  doc.text(data.invoiceNumber, 155, 65);
  
  doc.text("Date:", 120, 71);
  doc.text(formatDate(data.invoiceDate), 155, 71);
  
  doc.text("Due Date:", 120, 77);
  doc.text(formatDate(data.dueDate), 155, 77);
  
  // Table for items
  const tableColumn = ["Description", "Qty", "Unit", "Unit Price", "Amount"];
  const tableRows = data.items.map(item => [
    item.category ? `${item.category} - ${item.description}` : item.description,
    item.quantity.toString(),
    item.unit,
    formatCurrency(item.unitPrice),
    formatCurrency(item.amount)
  ]);
  
  doc.autoTable({
    startY: 85,
    head: [tableColumn],
    body: tableRows,
    headStyles: { 
      fillColor: [155, 135, 245],
      textColor: [255, 255, 255]
    },
    alternateRowStyles: {
      fillColor: [240, 240, 250]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });
  
  // Add summary section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.text("Summary", 130, finalY);
  doc.line(130, finalY + 2, 180, finalY + 2);
  
  doc.text("Subtotal:", 130, finalY + 10);
  doc.text(formatCurrency(data.subtotal), 180, finalY + 10, { align: "right" });
  
  if (data.isDepositInvoice) {
    doc.text("Deposit Amount:", 130, finalY + 17);
    doc.text(formatCurrency(data.depositAmount), 180, finalY + 17, { align: "right" });
    
    doc.text("Balance (Future Invoice):", 130, finalY + 24);
    doc.text(formatCurrency(data.subtotal - data.depositAmount), 180, finalY + 24, { align: "right" });
    
    doc.text("SST (6%):", 130, finalY + 31);
    doc.text(formatCurrency(data.tax), 180, finalY + 31, { align: "right" });
  } else {
    doc.text("SST (6%):", 130, finalY + 17);
    doc.text(formatCurrency(data.tax), 180, finalY + 17, { align: "right" });
  }
  
  doc.setFontSize(12);
  doc.text("Total Due:", 130, finalY + (data.isDepositInvoice ? 41 : 27));
  doc.setFontSize(12);
  doc.text(formatCurrency(data.total), 180, finalY + (data.isDepositInvoice ? 41 : 27), { align: "right" });
  
  // Add payment information
  const paymentY = finalY + (data.isDepositInvoice ? 53 : 39);
  doc.setFontSize(10);
  doc.text("Payment Information", 14, paymentY);
  doc.line(14, paymentY + 2, 100, paymentY + 2);
  
  doc.setFontSize(9);
  doc.text("Bank: MayBank", 14, paymentY + 8);
  doc.text("Account Name: RenovateProX Sdn Bhd", 14, paymentY + 14);
  doc.text("Account Number: 1234 5678 9012", 14, paymentY + 20);
  doc.text("Swift Code: MBBEMYKL", 14, paymentY + 26);
  
  if (data.paymentMethod) {
    doc.text("Payment Method: " + formatPaymentMethod(data.paymentMethod), 14, paymentY + 34);
  }
  
  // Add notes section
  const notesY = paymentY + 46;
  doc.setFontSize(10);
  doc.text("Notes:", 14, notesY);
  doc.setFontSize(9);
  const splitNotes = doc.splitTextToSize(data.notes || "Thank you for your business!", 180);
  doc.text(splitNotes, 14, notesY + 6);
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('RenovateProX Sdn Bhd | SSM: 123456-X | Generated on ' + new Date().toLocaleDateString(), 14, 290);
    doc.text('Page ' + i + ' of ' + pageCount, 180, 290, { align: 'right' });
  }
  
  // Save the PDF
  doc.save(`Invoice-${data.invoiceNumber}.pdf`);
};

// Helper function to format payment method
const formatPaymentMethod = (method: string): string => {
  switch (method) {
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'credit_card':
      return 'Credit Card';
    case 'cash':
      return 'Cash';
    case 'cheque':
      return 'Cheque';
    default:
      return method;
  }
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-MY', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit' 
  });
};
