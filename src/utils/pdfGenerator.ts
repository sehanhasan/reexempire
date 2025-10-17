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

interface DemandListItem {
  item_name: string;
  current_stock: number;
  required_quantity: number;
  unit_price: number;
  amount: number;
  urgent: boolean;
}

interface DemandListDetails {
  title: string;
  requestedDate: string;
  requiredDate: string;
  priority: string;
  items: DemandListItem[];
  totalAmount: number;
  notes?: string;
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
  
  // Add header with quotation number
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(`Quotation #${details.documentNumber}`, 20, 50);
  
  // Add quotation date and validity
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Date: ${details.documentDate}`, 20, 60);
  pdf.text(`Valid Until: ${details.expiryDate}`, 20, 67);
  
  // Customer Information Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('BILL TO:', 20, 80);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  let yPos = 90;
  
  if (details.customerName) {
    pdf.text(`Name: ${details.customerName}`, 20, yPos);
    yPos += 7;
  }
  
  if (details.unitNumber) {
    pdf.text(`Unit: ${details.unitNumber}`, 20, yPos);
    yPos += 7;
  }
  
  if (details.customerEmail) {
    pdf.text(`Email: ${details.customerEmail}`, 20, yPos);
    yPos += 7;
  }
  
  if (details.customerContact) {
    pdf.text(`Phone: ${details.customerContact}`, 20, yPos);
    yPos += 7;
  }
  
  if (details.customerAddress) {
    const addressLines = pdf.splitTextToSize(`Address: ${details.customerAddress}`, 170);
    pdf.text(addressLines, 20, yPos);
    yPos += addressLines.length * 7;
  }
  
  // Add some spacing
  yPos += 10;
  
  // Subject line if available
  if (details.subject) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Subject:', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    const subjectLines = pdf.splitTextToSize(details.subject, 150);
    pdf.text(subjectLines, 50, yPos);
    yPos += subjectLines.length * 7 + 10;
  }
  
  // Items table
  const tableData = details.items
    .filter(item => item.description && item.description.trim() !== '')
    .map((item, index) => [
      (index + 1).toString(),
      item.description,
      typeof item.quantity === 'string' ? item.quantity : item.quantity.toString(),
      item.unit,
      formatCurrency(item.unitPrice),
      formatCurrency(item.amount)
    ]);
  
  if (tableData.length > 0) {
    autoTable(pdf, {
      startY: yPos,
      head: [['No.', 'Description', 'Qty', 'Unit', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [70, 130, 180],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });
    
    // @ts-ignore
    yPos = pdf.lastAutoTable?.finalY + 15 || yPos + 50;
  }
  
  // Summary section
  const summaryStartX = 120;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  pdf.text('Subtotal:', summaryStartX, yPos);
  pdf.text(formatCurrency(subtotal), 170, yPos, { align: 'right' });
  yPos += 8;
  
  // Deposit information if applicable
  if (details.depositInfo.requiresDeposit && details.depositInfo.depositAmount > 0) {
    const depositPercentage = typeof details.depositInfo.depositPercentage === 'string' 
      ? parseFloat(details.depositInfo.depositPercentage) 
      : details.depositInfo.depositPercentage;
    
    pdf.text(`Deposit (${depositPercentage.toFixed(1)}%):`, summaryStartX, yPos);
    pdf.text(formatCurrency(details.depositInfo.depositAmount), 170, yPos, { align: 'right' });
    yPos += 8;
    
    pdf.text('Balance Due:', summaryStartX, yPos);
    pdf.text(formatCurrency(subtotal - details.depositInfo.depositAmount), 170, yPos, { align: 'right' });
    yPos += 8;
  }
  
  // Total
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('TOTAL:', summaryStartX, yPos);
  pdf.text(formatCurrency(subtotal), 170, yPos, { align: 'right' });
  yPos += 15;
  
  // Notes section
  if (details.notes && details.notes.trim()) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('NOTES:', 20, yPos);
    yPos += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const notesLines = pdf.splitTextToSize(details.notes, 170);
    pdf.text(notesLines, 20, yPos);
  }
  
  // Footer
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Thank you for your business!', 105, pageHeight - 20, { align: 'center' });
  pdf.text('© 2025 Reex Empire Sdn Bhd. All rights reserved.', 105, pageHeight - 15, { align: 'center' });
  
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

// Generate a demand list PDF
export const generateDemandListPDF = (details: DemandListDetails): jsPDF => {
  const pdf = generateBasePDF('DEMAND LIST');
  
  // Add header with title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(details.title, 20, 50);
  
  // Add dates and priority
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Requested Date: ${details.requestedDate}`, 20, 60);
  pdf.text(`Required Date: ${details.requiredDate}`, 20, 67);
  
  pdf.setFont('helvetica', 'bold');
  const priorityColor = details.priority === 'Urgent' ? [220, 38, 38] : [34, 197, 94];
  pdf.setTextColor(priorityColor[0], priorityColor[1], priorityColor[2]);
  pdf.text(`Priority: ${details.priority}`, 120, 60);
  pdf.setTextColor(0, 0, 0);
  
  let yPos = 85;
  
  // Items table
  const tableData = details.items.map((item, index) => [
    (index + 1).toString(),
    item.item_name,
    item.current_stock.toString(),
    item.required_quantity.toString(),
    formatCurrency(item.unit_price),
    formatCurrency(item.amount),
    item.urgent ? 'YES' : '-'
  ]);
  
  if (tableData.length > 0) {
    autoTable(pdf, {
      startY: yPos,
      head: [['No.', 'Item Name', 'Current Stock', 'Required Qty', 'Unit Price', 'Amount', 'Urgent']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [70, 130, 180],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 18, halign: 'center' }
      },
      margin: { left: 20, right: 20 }
    });
    
    // @ts-ignore
    yPos = pdf.lastAutoTable?.finalY + 15 || yPos + 50;
  }
  
  // Total amount
  const summaryStartX = 120;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('TOTAL AMOUNT:', summaryStartX, yPos);
  pdf.text(formatCurrency(details.totalAmount), 170, yPos, { align: 'right' });
  yPos += 15;
  
  // Notes section
  if (details.notes && details.notes.trim()) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('NOTES:', 20, yPos);
    yPos += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const notesLines = pdf.splitTextToSize(details.notes, 170);
    pdf.text(notesLines, 20, yPos);
  }
  
  // Footer
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('For internal use only', 105, pageHeight - 20, { align: 'center' });
  pdf.text('© 2025 Reex Empire Sdn Bhd. All rights reserved.', 105, pageHeight - 15, { align: 'center' });
  
  return pdf;
};

// Function to download the PDF
export const downloadPDF = (pdf: jsPDF, filename: string): void => {
  pdf.save(filename);
};
