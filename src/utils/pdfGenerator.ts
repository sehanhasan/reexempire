
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
  pdf.setFontSize(10);
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
  const pdf = new jsPDF();
  
  // Add logo
  addLogo(pdf, 15, 15, 35);
  
  // Add company info
  addCompanyInfo(pdf, 60, 25);
  
  // Add document title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text(title, pdf.internal.pageSize.width - 15, 25, { align: 'right' });
  pdf.setLineWidth(0.5);
  pdf.line(pdf.internal.pageSize.width - 80, 27, pdf.internal.pageSize.width - 15, 27);
  
  return pdf;
};

// Generate a quotation PDF
export const generateQuotationPDF = (details: QuotationDetails): jsPDF => {
  const pdf = generateBasePDF('QUOTATION');
  const subtotal = calculateSubtotal(details.items);
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal);
  
  // Add customer details section - more compact
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, 55, 85, 40, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Bill to:', 20, 65);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const billToLines = [
    `Attn: ${details.customerName}`,
    details.unitNumber ? `Unit ${details.unitNumber}` : '',
    details.customerAddress || '',
    details.customerContact || ''
  ].filter(line => line !== '');
  
  pdf.text(billToLines, 20, 72);
  
  // Add quotation details table on the right - more compact
  pdf.setFillColor(240, 240, 240);
  pdf.rect(pdf.internal.pageSize.width - 85, 55, 70, 40, 'F');
  
  const quotationDetailsTable = [
    ['Date:', details.documentDate],
    ['Quotation No:', details.documentNumber],
    ['Customer ID:', '']
  ];
  
  autoTable(pdf, {
    startY: 60,
    margin: { left: pdf.internal.pageSize.width - 83 },
    tableWidth: 66,
    body: quotationDetailsTable,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 1,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 },
      1: { cellWidth: 38 }
    }
  });
  
  let startY = 105;
  
  // Add subject if available - more compact
  if (details.subject) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Subject:', 15, startY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(details.subject, 45, startY);
    startY += 8;
  }
  
  // Add items table with category information
  const tableHeaders = [
    { header: 'No.', dataKey: 'no' },
    { header: 'Description', dataKey: 'description' },
    { header: 'Price/Unit', dataKey: 'unitPrice' },
    { header: 'QTY', dataKey: 'quantity' },
    { header: 'Amount', dataKey: 'amount' }
  ];
  
  const tableData = details.items.map((item, index) => ({
    no: (index + 1).toString(),
    description: `${item.category ? item.category + ' - ' : ''}${item.description}`,
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
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
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
    }
  });
  
  // Get the final Y position after the table
  // @ts-ignore - lastAutoTable is added by the plugin but not in the type definition
  const tableEndY = pdf.lastAutoTable?.finalY || 200;
  
  // Add summary calculation - more compact
  const summaryTable = [
    ['Sub Total:', formatCurrency(subtotal)],
    ['Others:', ''],
    ['Total Balance Due:', formatCurrency(total)]
  ];
  
  autoTable(pdf, {
    startY: tableEndY + 3,
    body: summaryTable,
    theme: 'plain',
    styles: {
      fontSize: 9,
    },
    margin: { left: pdf.internal.pageSize.width - 80 },
    tableWidth: 65,
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 30, halign: 'right' }
    }
  });
  
  // Add Terms and Conditions - more compact
  const termsY = tableEndY + 30;
  pdf.setFillColor(150, 150, 150);
  pdf.rect(15, termsY, 40, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Terms and Conditions', 17, termsY + 4);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text([
    'Payment terms 30days',
    'Pjt duration 5-7 working days'
  ], 15, termsY + 12);
  
  // Add Contact Section - more compact
  const contactY = termsY + 25;
  pdf.setFillColor(150, 150, 150);
  pdf.rect(15, contactY, 20, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact', 17, contactY + 4);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.text([
    'For all enquiries, please contact Star Residences Management',
    'Email: info@starresidences.com.my',
    'Tel: +603-2168-1688'
  ], 15, contactY + 12);
  
  // Add Customer Acceptance section - more compact
  const acceptanceY = contactY + 30;
  pdf.setFillColor(150, 150, 150);
  pdf.rect(15, acceptanceY, 35, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Customer Acceptance:', 17, acceptanceY + 4);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  
  // Signature line
  pdf.text('Signature:', 25, acceptanceY + 15);
  pdf.line(65, acceptanceY + 15, 160, acceptanceY + 15);
  
  // Name line
  pdf.text('Name:', 25, acceptanceY + 25);
  pdf.line(65, acceptanceY + 25, 160, acceptanceY + 25);
  
  // Date line
  pdf.text('Date:', 25, acceptanceY + 35);
  pdf.line(65, acceptanceY + 35, 160, acceptanceY + 35);
  
  // Add notes if any
  if (details.notes) {
    const notesY = Math.max(tableEndY + 80, acceptanceY + 45);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('NOTES', 15, notesY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    // Split notes into multiple lines if needed
    const splitNotes = pdf.splitTextToSize(details.notes, 180);
    pdf.text(splitNotes, 15, notesY + 8);
  }
  
  // Add footer
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Thank you for your business!', pdf.internal.pageSize.width / 2, pageHeight - 15, { align: 'center' });
  
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
  
  // Add customer details section - more compact
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, 55, 85, 40, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Bill to:', 20, 65);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const billToLines = [
    `Attn: ${details.customerName}`,
    details.unitNumber ? `Unit ${details.unitNumber}` : '',
    details.customerAddress || '',
    details.customerContact || ''
  ].filter(line => line !== '');
  
  pdf.text(billToLines, 20, 72);
  
  // Add invoice details table on the right - more compact
  pdf.setFillColor(240, 240, 240);
  pdf.rect(pdf.internal.pageSize.width - 85, 55, 70, 40, 'F');
  
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
    startY: 60,
    margin: { left: pdf.internal.pageSize.width - 83 },
    tableWidth: 66,
    body: invoiceDetailsTable,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 1,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 },
      1: { cellWidth: 38 }
    }
  });
  
  let startY = 105;
  
  // Add subject if available - more compact
  if (details.subject) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Subject:', 15, startY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(details.subject, 45, startY);
    startY += 8;
  }
  
  // Add items table with category information
  const tableHeaders = [
    { header: 'No.', dataKey: 'no' },
    { header: 'Description', dataKey: 'description' },
    { header: 'Price/Unit', dataKey: 'unitPrice' },
    { header: 'QTY', dataKey: 'quantity' },
    { header: 'Amount', dataKey: 'amount' }
  ];
  
  const tableData = details.items.map((item, index) => ({
    no: (index + 1).toString(),
    description: `${item.category ? item.category + ' - ' : ''}${item.description}`,
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
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' }
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
    }
  });
  
  // Get the final Y position after the table
  // @ts-ignore - lastAutoTable is added by the plugin but not in the type definition
  let tableEndY = pdf.lastAutoTable?.finalY || 200;
  
  // Add any images if provided
  if (details.images && details.images.length > 0) {
    pdf.addPage();
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('WORK PHOTOS', 15, 20);
    
    const imagesPerRow = 2;
    const imageWidth = 75;
    const imageHeight = 75;
    const marginX = 15;
    const marginY = 30;
    const spacingX = 20;
    const spacingY = 85;
    
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
    
    // Reset to the first page
    pdf.setPage(1);
  }
  
  // Add summary calculation - more compact
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
    startY: tableEndY + 3,
    body: summaryTable,
    theme: 'plain',
    styles: {
      fontSize: 9,
    },
    margin: { left: pdf.internal.pageSize.width - 80 },
    tableWidth: 65,
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 30, halign: 'right' }
    }
  });
  
  // Add Terms and Conditions - more compact
  const termsY = tableEndY + 30;
  pdf.setFillColor(150, 150, 150);
  pdf.rect(15, termsY, 40, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Terms and Conditions', 17, termsY + 4);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text([
    'Payment terms 30days',
    'Pjt duration 5-7 working days'
  ], 15, termsY + 12);
  
  // Add Contact Section - more compact
  const contactY = termsY + 25;
  pdf.setFillColor(150, 150, 150);
  pdf.rect(15, contactY, 20, 6, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact', 17, contactY + 4);
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.text([
    'For all enquiries, please contact Star Residences Management',
    'Email: info@starresidences.com.my',
    'Tel: +603-2168-1688'
  ], 15, contactY + 12);
  
  // Add notes if any
  if (details.notes) {
    const notesY = contactY + 30;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('NOTES', 15, notesY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    // Split notes into multiple lines if needed
    const splitNotes = pdf.splitTextToSize(details.notes, 180);
    pdf.text(splitNotes, 15, notesY + 8);
  }
  
  // Add footer
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Thank you for your business!', pdf.internal.pageSize.width / 2, pageHeight - 15, { align: 'center' });
  
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
