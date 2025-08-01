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
  customerAddress?: string;
  customerContact?: string;
  customerEmail?: string;
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
  images?: string[]; // URLs for any images to include in the PDF
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

// Add logo to PDF
const addLogo = (pdf: jsPDF, x: number, y: number, width: number) => {
  try {
    // Using the Reex Empire logo
    pdf.addImage('/lovable-uploads/5000d120-da72-4502-bb4f-8d42de790fdf.png', 'PNG', x, y, width, width * 0.75);
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback if image fails to load
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('STAR RESIDENCES', x, y + 10);
  }
};

// Add company info to PDF
const addCompanyInfo = (pdf: jsPDF, x: number, y: number) => {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text([
    'Reex Empire Sdn Bhd (1426553-A)',
    'No. 29-1, Jalan 2A/6',
    'Taman Setapak Indah',
    '53300 Setapak Kuala Lumpur',
    'www.reexempire.com'
  ], x, y);
};

// Base PDF generation function with proper A4 margins
const generateBasePDF = (title: string): jsPDF => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add logo
  addLogo(pdf, 20, 15, 30);
  
  // Add company info
  addCompanyInfo(pdf, 60, 20);
  
  // Add document title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(title, 190, 25, { align: 'right' });
  pdf.setLineWidth(0.3);
  pdf.line(140, 27, 190, 27);
  
  return pdf;
};

// Generate a quotation PDF
export const generateQuotationPDF = (details: QuotationDetails): jsPDF => {
  const pdf = generateBasePDF('QUOTATION');
  const subtotal = calculateSubtotal(details.items);
  
  // Add quotation number
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(`Quotation #${details.documentNumber}`, 105, 40, { align: 'center' });
  pdf.text('Sent', 105, 48, { align: 'center' });
  
  // Customer Information section
  pdf.setFillColor(245, 245, 245);
  pdf.rect(20, 55, 170, 35, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Customer Information', 25, 62);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  // Customer details in columns
  pdf.setFont('helvetica', 'bold');
  pdf.text('Customer', 25, 70);
  pdf.text('Email', 100, 70);
  pdf.text('Phone', 150, 70);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(details.customerName || 'N/A', 25, 76);
  pdf.text(details.customerEmail || 'N/A', 100, 76);
  pdf.text(details.customerContact || 'N/A', 150, 76);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Unit Number', 25, 82);
  pdf.setFont('helvetica', 'normal');
  pdf.text(details.unitNumber || 'N/A', 25, 88);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Address', 100, 82);
  pdf.setFont('helvetica', 'normal');
  pdf.text(details.customerAddress || 'N/A', 100, 88);
  
  // Quotation Details section
  pdf.setFillColor(245, 245, 245);
  pdf.rect(20, 95, 170, 25, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Quotation Details', 25, 102);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  // Details in columns
  pdf.setFont('helvetica', 'bold');
  pdf.text('Issue Date', 25, 108);
  pdf.text('Expiry Date', 80, 108);
  pdf.text('Subtotal', 130, 108);
  pdf.text('Total', 155, 108);
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(details.documentDate, 25, 114);
  pdf.text(details.expiryDate, 80, 114);
  pdf.text(`RM ${subtotal.toFixed(2)}`, 130, 114);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 100, 200);
  pdf.text(`RM ${subtotal.toFixed(2)}`, 155, 114);
  pdf.setTextColor(0, 0, 0);
  
  // Items section
  pdf.setFillColor(245, 245, 245);
  pdf.rect(20, 125, 170, 10, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Items', 25, 131);
  
  // Group items by category and display them properly
  const groupedItems: { [key: string]: (QuotationItem | InvoiceItem)[] } = {};
  details.items.forEach(item => {
    const category = item.category || 'Other Items';
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });
  
  let currentY = 145;
  
  Object.keys(groupedItems).forEach(category => {
    // Category header
    if (category !== 'Other Items' || groupedItems[category].some(item => item.category)) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(0, 100, 200);
      pdf.text(category, 25, currentY);
      currentY += 8;
      pdf.setTextColor(0, 0, 0);
    }
    
    // Items table for this category
    const categoryItems = groupedItems[category];
    const tableData = categoryItems.map(item => [
      item.description,
      item.quantity.toString(),
      item.unit,
      formatCurrency(item.unitPrice),
      formatCurrency(item.amount)
    ]);
    
    autoTable(pdf, {
      startY: currentY,
      head: [['Description', 'Quantity', 'Unit', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [150, 150, 150],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });
    
    // @ts-ignore - lastAutoTable is added by the plugin
    currentY = pdf.lastAutoTable?.finalY + 10 || currentY + 20;
  });
  
  // Add footer
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Thank you for your business!', 105, pageHeight - 15, { align: 'center' });
  pdf.text('© 2025 Reex Empire Sdn Bhd. All rights reserved.', 105, pageHeight - 10, { align: 'center' });
  
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
  
  // Add customer details section
  pdf.setFillColor(240, 240, 240);
  pdf.rect(20, 60, 80, 50, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Bill to:', 25, 70);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const billToLines = [
    `Attn: ${details.customerName}`,
    details.unitNumber ? `Unit ${details.unitNumber}` : '',
    details.customerAddress || '',
    details.customerContact || '',
    details.customerEmail || ''
  ].filter(line => line !== '');
  
  pdf.text(billToLines, 25, 80);
  
  // Add invoice details table on the right
  pdf.setFillColor(240, 240, 240);
  pdf.rect(110, 60, 80, 50, 'F');
  
  const invoiceDetailsTable = [
    ['Date:', details.documentDate],
    ['Invoice No:', details.documentNumber],
    ['Due Date:', details.dueDate],
    ['Payment Method:', details.paymentMethod.replace('_', ' ').toUpperCase()]
  ];
  
  if (details.quotationReference) {
    invoiceDetailsTable.push(['Quotation Ref:', details.quotationReference]);
  }
  
  autoTable(pdf, {
    startY: 65,
    margin: { left: 112 },
    tableWidth: 76,
    body: invoiceDetailsTable,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 1,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      1: { cellWidth: 46 }
    }
  });
  
  let startY = 120;
  
  // Add subject if available
  if (details.subject) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Subject:', 20, startY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(details.subject, 45, startY);
    startY += 10;
  }
  
  // Add items table
  const tableHeaders = [
    { header: 'No.', dataKey: 'no' },
    { header: 'Description', dataKey: 'description' },
    { header: 'Price/Unit', dataKey: 'unitPrice' },
    { header: 'QTY', dataKey: 'quantity' },
    { header: 'Amount', dataKey: 'amount' }
  ];
  
  const tableData = details.items.map((item, index) => ({
    no: (index + 1).toString(),
    description: item.description,
    quantity: item.quantity,
    unitPrice: formatCurrency(item.unitPrice),
    amount: formatCurrency(item.amount)
  }));
  
  autoTable(pdf, {
    startY: startY,
    head: [tableHeaders.map(h => h.header)],
    body: tableData.map(item => [
      item.no,
      item.description,
      item.unitPrice,
      item.quantity,
      item.amount
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [150, 150, 150],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 35, halign: 'right' }
    },
    didParseCell: (data) => {
      // Style for numeric columns
      if (data.column.index > 1) {
        data.cell.styles.halign = 'right';
      }
      // Make description column left-aligned
      if (data.column.index === 1) {
        data.cell.styles.halign = 'left';
      }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Get the final Y position after the table
  // @ts-ignore - lastAutoTable is added by the plugin but not in the type definition
  let tableEndY = pdf.lastAutoTable?.finalY || 200;
  
  // Add any images if provided
  if (details.images && details.images.length > 0) {
    pdf.addPage();
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('WORK PHOTOS', 20, 25);
    
    const imagesPerRow = 2;
    const imageWidth = 70;
    const imageHeight = 70;
    const marginX = 20;
    const marginY = 35;
    const spacingX = 15;
    const spacingY = 80;
    
    details.images.forEach((imageUrl, index) => {
      const row = Math.floor(index / imagesPerRow);
      const col = index % imagesPerRow;
      
      const x = marginX + col * (imageWidth + spacingX);
      const y = marginY + row * spacingY;
      
      try {
        pdf.addImage(imageUrl, 'JPEG', x, y, imageWidth, imageHeight);
        
        // Add caption below image
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`Photo ${index + 1}`, x, y + imageHeight + 8);
      } catch (error) {
        console.error(`Error adding image ${index}:`, error);
        
        // Draw a placeholder if image fails to load
        pdf.setDrawColor(200, 200, 200);
        pdf.setFillColor(240, 240, 240);
        pdf.roundedRect(x, y, imageWidth, imageHeight, 3, 3, 'FD');
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.text('Image could not be loaded', x + imageWidth/2, y + imageHeight/2, { align: 'center' });
      }
    });
    
    // Reset to the first page for summary
    pdf.setPage(1);
  }
  
  // Add summary calculation
  let summaryTable;
  if (details.isDepositInvoice) {
    summaryTable = [
      ['Subtotal:', formatCurrency(subtotal)],
      [`Deposit (${details.depositPercentage}%):`, formatCurrency(details.depositAmount)],
      ['Balance Due (Future Invoice):', formatCurrency(subtotal - details.depositAmount)],
      ['SST (6%) on Deposit:', formatCurrency(tax)],
      ['Total Due Now:', formatCurrency(total)]
    ];
  } else {
    summaryTable = [
      ['Subtotal:', formatCurrency(subtotal)],
      ['SST (6%):', formatCurrency(tax)],
      ['Total Due:', formatCurrency(total)]
    ];
  }
  
  autoTable(pdf, {
    startY: tableEndY + 10,
    body: summaryTable,
    theme: 'plain',
    styles: {
      fontSize: 10,
    },
    margin: { left: 110, right: 20 },
    tableWidth: 80,
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 40, halign: 'right' }
    }
  });
  
  // Add notes if available
  if (details.notes) {
    const notesY = tableEndY + 60;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('NOTES', 20, notesY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    // Split notes into multiple lines if needed
    const splitNotes = pdf.splitTextToSize(details.notes, 170);
    pdf.text(splitNotes, 20, notesY + 8);
  }
  
  // Add footer
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Thank you for your business!', 105, pageHeight - 15, { align: 'center' });
  pdf.text('© 2025 Reex Empire Sdn Bhd. All rights reserved.', 105, pageHeight - 10, { align: 'center' });
  
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
