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
  images?: string[];
}

const formatCurrency = (amount: number): string => {
  return `RM ${amount.toFixed(2)}`;
};

const calculateSubtotal = (items: QuotationItem[] | InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + item.amount, 0);
};

const calculateTax = (subtotal: number): number => {
  return subtotal * 0.06;
};

const calculateTotal = (subtotal: number): number => {
  return subtotal + calculateTax(subtotal);
};

// Add logo to PDF
const addLogo = (pdf: jsPDF, x: number, y: number, width: number) => {
  try {
    pdf.addImage('/lovable-uploads/5000d120-da72-4502-bb4f-8d42de790fdf.png', 'PNG', x, y, width, width * 0.75);
  } catch (error) {
    console.error('Error loading logo:', error);
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

// Base PDF generation function
const generateBasePDF = (title: string): jsPDF => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add logo (smaller and properly positioned)
  addLogo(pdf, 20, 10, 25);
  
  // Add company info (aligned with logo)
  addCompanyInfo(pdf, 55, 15);
  
  // Add document title (properly aligned)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(title, 190, 20, { align: 'right' });
  
  // Add a line under the title
  pdf.setLineWidth(0.5);
  pdf.line(140, 25, 190, 25);
  
  return pdf;
};

// Generate a quotation PDF
export const generateQuotationPDF = (details: QuotationDetails): jsPDF => {
  const pdf = generateBasePDF('QUOTATION');
  const subtotal = calculateSubtotal(details.items);
  
  // Document info section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(`Quotation #${details.documentNumber}`, 20, 45);
  
  // Customer Information in a clean box
  pdf.setFillColor(248, 249, 250);
  pdf.rect(20, 55, 170, 40, 'F');
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(20, 55, 170, 40, 'S');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('CUSTOMER INFORMATION', 25, 62);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  // Customer details in organized layout
  pdf.setFont('helvetica', 'bold');
  pdf.text('Name:', 25, 70);
  pdf.setFont('helvetica', 'normal');
  pdf.text(details.customerName || 'N/A', 45, 70);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Unit:', 25, 76);
  pdf.setFont('helvetica', 'normal');
  pdf.text(details.unitNumber || 'N/A', 45, 76);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Email:', 105, 70);
  pdf.setFont('helvetica', 'normal');
  pdf.text(details.customerEmail || 'N/A', 120, 70);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Phone:', 105, 76);
  pdf.setFont('helvetica', 'normal');
  pdf.text(details.customerContact || 'N/A', 120, 76);
  
  if (details.customerAddress) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Address:', 25, 82);
    pdf.setFont('helvetica', 'normal');
    // Split long addresses
    const addressLines = pdf.splitTextToSize(details.customerAddress, 140);
    pdf.text(addressLines, 45, 82);
  }
  
  // Quotation details
  pdf.setFillColor(248, 249, 250);
  pdf.rect(20, 100, 170, 20, 'F');
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(20, 100, 170, 20, 'S');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('QUOTATION DETAILS', 25, 107);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date:', 25, 114);
  pdf.setFont('helvetica', 'normal');
  pdf.text(details.documentDate, 45, 114);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Valid Until:', 80, 114);
  pdf.setFont('helvetica', 'normal');
  pdf.text(details.expiryDate, 110, 114);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total:', 140, 114);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(formatCurrency(subtotal), 160, 114);
  
  // Items section
  let currentY = 130;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('ITEMS', 20, currentY);
  currentY += 10;
  
  // Group items by category for better organization
  const groupedItems: { [key: string]: (QuotationItem | InvoiceItem)[] } = {};
  details.items.forEach(item => {
    const category = (item.category && item.category.trim()) || 'Other Items';
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });
  
  // Only show categories that have items with content
  const validCategories = Object.keys(groupedItems).filter(category => 
    groupedItems[category].some(item => item.description && item.description.trim() !== '')
  );
  
  validCategories.forEach(category => {
    const categoryItems = groupedItems[category].filter(item => 
      item.description && item.description.trim() !== ''
    );
    
    if (categoryItems.length === 0) return;
    
    // Category header (only if not "Other Items" or if explicitly set)
    if (category !== 'Other Items' || categoryItems.some(item => item.category)) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 100, 200);
      pdf.text(category, 20, currentY);
      currentY += 6;
      pdf.setTextColor(0, 0, 0);
    }
    
    // Items table for this category
    const tableData = categoryItems.map(item => [
      item.description,
      item.quantity.toString(),
      item.unit,
      formatCurrency(item.unitPrice),
      formatCurrency(item.amount)
    ]);
    
    autoTable(pdf, {
      startY: currentY,
      head: [['Description', 'Qty', 'Unit', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [100, 100, 100],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 85 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });
    
    // @ts-ignore
    currentY = pdf.lastAutoTable?.finalY + 8 || currentY + 20;
  });
  
  // Summary section
  const summaryY = currentY + 10;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  // Subtotal
  pdf.text('Subtotal:', 140, summaryY);
  pdf.text(formatCurrency(subtotal), 175, summaryY, { align: 'right' });
  
  // Deposit information if applicable
  if (details.depositInfo.requiresDeposit && details.depositInfo.depositAmount > 0) {
    pdf.text(`Deposit (${details.depositInfo.depositPercentage.toFixed(1)}%):`, 140, summaryY + 6);
    pdf.text(formatCurrency(details.depositInfo.depositAmount), 175, summaryY + 6, { align: 'right' });
    
    pdf.text('Balance Due:', 140, summaryY + 12);
    pdf.text(formatCurrency(subtotal - details.depositInfo.depositAmount), 175, summaryY + 12, { align: 'right' });
  }
  
  // Total
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('TOTAL:', 140, summaryY + 20);
  pdf.text(formatCurrency(subtotal), 175, summaryY + 20, { align: 'right' });
  
  // Notes if any
  if (details.notes && details.notes.trim()) {
    const notesY = summaryY + 35;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('NOTES:', 20, notesY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const splitNotes = pdf.splitTextToSize(details.notes, 170);
    pdf.text(splitNotes, 20, notesY + 6);
  }
  
  // Footer
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
