
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuotationData {
  quotation: any;
  customer: any;
  items: any[];
  signatureData?: string;
}

interface InvoiceData {
  invoice: any;
  customer: any;
  items: any[];
  images: any[];
}

const formatCurrency = (amount: number): string => {
  return `RM ${amount.toFixed(2)}`;
};

// Add logo to PDF
const addLogo = (pdf: jsPDF, x: number, y: number, width: number) => {
  try {
    pdf.addImage('https://i.ibb.co/Ltyts5K/reex-empire-logo.png', 'PNG', x, y, width, width * 0.75);
  } catch (error) {
    console.error('Error loading logo:', error);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REEX EMPIRE', x, y + 10);
  }
};

// Add company info to PDF
const addCompanyInfo = (pdf: jsPDF, x: number, y: number) => {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text([
    'Reex Empire Sdn Bhd (1426553-A)',
    'No. 29-1, Jalan 2A/6, Taman Setapak Indah',
    '53300 Setapak Kuala Lumpur',
    'www.reexempire.com'
  ], x, y);
};

export const generateQuotationPDF = (data: QuotationData): void => {
  const { quotation, customer, items, signatureData } = data;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Add logo and company info
  addLogo(pdf, 20, 10, 25);
  addCompanyInfo(pdf, 55, 15);

  // Add quotation title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('QUOTATION', 190, 20, { align: 'right' });

  // Add quotation number and details
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(`Quotation #${quotation.reference_number}`, 20, 50);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Issue Date: ${new Date(quotation.issue_date).toLocaleDateString()}`, 20, 60);
  pdf.text(`Expiry Date: ${new Date(quotation.expiry_date).toLocaleDateString()}`, 20, 67);
  pdf.text(`Status: ${quotation.status}`, 20, 74);

  // Customer Information
  if (customer) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('BILL TO:', 20, 90);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    let yPos = 100;
    pdf.text(`Attn: ${customer.name}`, 20, yPos);
    yPos += 7;
    if (customer.unit_number) {
      pdf.text(`Unit: ${customer.unit_number}`, 20, yPos);
      yPos += 7;
    }
    if (customer.address) {
      pdf.text(`Address: ${customer.address}`, 20, yPos);
      yPos += 7;
    }
  }

  // Subject
  let tableStartY = 130;
  if (quotation.subject) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Subject:', 20, tableStartY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(quotation.subject, 20, tableStartY + 7);
    tableStartY += 20;
  }

  // Group items by category
  const groupedItems: { [key: string]: any[] } = {};
  items.forEach((item) => {
    const category = item.category || 'Other Items';
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });

  const categories = Object.keys(groupedItems).sort();

  // Create table data with category headers
  const tableData: any[] = [];
  categories.forEach((category, categoryIndex) => {
    // Add category header row
    tableData.push([
      { content: `${categoryIndex + 1}- ${category}`, colSpan: 4, styles: { fillColor: [173, 216, 230], fontStyle: 'bold' } }
    ]);
    
    // Add items for this category
    groupedItems[category].forEach((item) => {
      tableData.push([
        item.description,
        item.quantity.toString(),
        formatCurrency(item.unit_price),
        formatCurrency(item.amount)
      ]);
    });
  });

  // Items table
  autoTable(pdf, {
    startY: tableStartY,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
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
      0: { cellWidth: 100 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });

  // @ts-ignore
  let yPos = pdf.lastAutoTable?.finalY + 15 || tableStartY + 100;

  // Summary section
  const summaryStartX = 120;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);

  pdf.text('Subtotal:', summaryStartX, yPos);
  pdf.text(formatCurrency(quotation.subtotal), 170, yPos, { align: 'right' });
  yPos += 8;

  if (quotation.requires_deposit && quotation.deposit_amount > 0) {
    pdf.text(`Deposit (${quotation.deposit_percentage}%):`, summaryStartX, yPos);
    pdf.text(formatCurrency(quotation.deposit_amount), 170, yPos, { align: 'right' });
    yPos += 8;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('TOTAL:', summaryStartX, yPos);
  pdf.text(formatCurrency(quotation.total), 170, yPos, { align: 'right' });
  yPos += 15;

  // Terms & Conditions
  if (quotation.terms) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('TERMS & CONDITIONS:', 20, yPos);
    yPos += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const termsLines = pdf.splitTextToSize(quotation.terms, 170);
    pdf.text(termsLines, 20, yPos);
    yPos += termsLines.length * 5 + 10;
  }

  // Signature section
  if (signatureData || quotation.signature_data) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('CUSTOMER SIGNATURE:', 20, yPos);
    yPos += 10;

    try {
      pdf.addImage(signatureData || quotation.signature_data, 'PNG', 20, yPos, 60, 30);
    } catch (error) {
      console.error('Error adding signature:', error);
    }
    yPos += 35;
  }

  // Footer
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('For all enquiries, please contact Khalil Pasha', 105, pageHeight - 25, { align: 'center' });
  pdf.text('Email: reexsb@gmail.com Tel: 011-1665 6525 / 019-999 1024', 105, pageHeight - 20, { align: 'center' });
  pdf.text('© 2025 Reex Empire Sdn Bhd. All rights reserved.', 105, pageHeight - 15, { align: 'center' });

  // Download the PDF
  pdf.save(`quotation-${quotation.reference_number}.pdf`);
};

export const generateInvoicePDF = (data: InvoiceData): void => {
  const { invoice, customer, items, images } = data;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Add logo and company info
  addLogo(pdf, 20, 10, 25);
  addCompanyInfo(pdf, 55, 15);

  // Add invoice title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('INVOICE', 190, 20, { align: 'right' });

  // Add invoice number and details
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(`Invoice #${invoice.reference_number}`, 20, 50);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 20, 60);
  pdf.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 67);

  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  const isPastDue = dueDate < today && invoice.payment_status !== "Paid";
  const displayPaymentStatus = isPastDue && invoice.payment_status === "Unpaid" ? "Overdue" : invoice.payment_status;
  
  pdf.text(`Status: ${displayPaymentStatus}`, 20, 74);

  // Customer Information
  if (customer) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('BILL TO:', 20, 90);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    let yPos = 100;
    pdf.text(`Attn: ${customer.name}`, 20, yPos);
    yPos += 7;
    if (customer.unit_number) {
      pdf.text(`Unit: ${customer.unit_number}`, 20, yPos);
      yPos += 7;
    }
    if (customer.address) {
      pdf.text(`Address: ${customer.address}`, 20, yPos);
      yPos += 7;
    }
  }

  // Subject
  let tableStartY = 130;
  if (invoice.subject) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Subject:', 20, tableStartY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.subject, 20, tableStartY + 7);
    tableStartY += 20;
  }

  // Group items by category
  const groupedItems: { [key: string]: any[] } = {};
  items.forEach((item) => {
    const category = item.category || 'Other Items';
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });

  const categories = Object.keys(groupedItems).sort();

  // Create table data with category headers
  const tableData: any[] = [];
  categories.forEach((category, categoryIndex) => {
    // Add category header row
    tableData.push([
      { content: `${categoryIndex + 1}- ${category}`, colSpan: 4, styles: { fillColor: [173, 216, 230], fontStyle: 'bold' } }
    ]);
    
    // Add items for this category
    groupedItems[category].forEach((item) => {
      tableData.push([
        item.description,
        formatCurrency(item.unit_price),
        item.quantity.toString(),
        formatCurrency(item.amount)
      ]);
    });
  });

  // Items table
  autoTable(pdf, {
    startY: tableStartY,
    head: [['Description', 'Price', 'Qty', 'Amount']],
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
      0: { cellWidth: 100 },
      1: { cellWidth: 25, halign: 'right' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });

  // @ts-ignore
  let yPos = pdf.lastAutoTable?.finalY + 15 || tableStartY + 100;

  // Summary section
  const summaryStartX = 120;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);

  pdf.text('Subtotal:', summaryStartX, yPos);
  pdf.text(formatCurrency(invoice.subtotal), 170, yPos, { align: 'right' });
  yPos += 8;

  if (invoice.tax_rate > 0) {
    pdf.text(`Tax (${invoice.tax_rate}%):`, summaryStartX, yPos);
    pdf.text(formatCurrency(invoice.tax_amount), 170, yPos, { align: 'right' });
    yPos += 8;
  }

  if (invoice.is_deposit_invoice) {
    pdf.text('Deposit Amount:', summaryStartX, yPos);
    pdf.text(formatCurrency(invoice.deposit_amount), 170, yPos, { align: 'right' });
    yPos += 8;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('TOTAL:', summaryStartX, yPos);
  pdf.text(formatCurrency(invoice.total), 170, yPos, { align: 'right' });
  yPos += 15;

  // Payment Details
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('PAYMENT DETAILS:', 20, yPos);
  yPos += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text([
    'Company Name: Reex Empire Sdn Bhd',
    'Bank Name: Maybank',
    'Account No: 514897120482',
    '*Please include the invoice number on payment reference*'
  ], 20, yPos);
  yPos += 35;

  // Terms & Conditions
  if (invoice.terms) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('TERMS & CONDITIONS:', 20, yPos);
    yPos += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const termsLines = pdf.splitTextToSize(invoice.terms, 170);
    pdf.text(termsLines, 20, yPos);
    yPos += termsLines.length * 5 + 10;
  }

  // Work Photos (if any)
  if (images && images.length > 0) {
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
    
    images.forEach((image, index) => {
      const row = Math.floor(index / imagesPerRow);
      const col = index % imagesPerRow;
      
      const x = marginX + col * (imageWidth + spacingX);
      const y = marginY + row * spacingY;
      
      try {
        pdf.addImage(image.image_url, 'JPEG', x, y, imageWidth, imageHeight);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`Photo ${index + 1}`, x, y + imageHeight + 8);
      } catch (error) {
        console.error(`Error adding image ${index}:`, error);
        
        pdf.setDrawColor(200, 200, 200);
        pdf.setFillColor(240, 240, 240);
        pdf.rect(x, y, imageWidth, imageHeight, 'FD');
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.text('Image not available', x + imageWidth/2, y + imageHeight/2, { align: 'center' });
      }
    });
    
    // Reset to first page for footer
    pdf.setPage(1);
  }

  // Footer
  const pageHeight = pdf.internal.pageSize.height;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('For all enquiries, please contact Khalil Pasha', 105, pageHeight - 25, { align: 'center' });
  pdf.text('Email: reexsb@gmail.com Tel: 011-1665 6525 / 019-999 1024', 105, pageHeight - 20, { align: 'center' });
  pdf.text('© 2025 Reex Empire Sdn Bhd. All rights reserved.', 105, pageHeight - 15, { align: 'center' });

  // Download the PDF
  pdf.save(`invoice-${invoice.reference_number}.pdf`);
};
