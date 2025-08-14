
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const captureViewAsPDF = async (
  elementId: string,
  filename: string,
  options: {
    scale?: number;
    useCORS?: boolean;
    allowTaint?: boolean;
    backgroundColor?: string;
  } = {}
) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }
    
    // Hide print-hidden elements temporarily
    const printHiddenElements = element.querySelectorAll('.print\\:hidden');
    const originalDisplays: string[] = [];
    printHiddenElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      originalDisplays[index] = htmlEl.style.display;
      htmlEl.style.display = 'none';
    });
    
    // Enhanced options for better quality
    const defaultOptions = {
      scale: 2.5, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true,
      scrollX: 0,
      scrollY: 0,
      width: element.scrollWidth,
      height: element.scrollHeight,
      x: 0,
      y: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      ...options
    };

    // Capture the element as canvas with high quality
    const canvas = await html2canvas(element, defaultOptions);
    
    // Restore print-hidden elements
    printHiddenElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = originalDisplays[index] || '';
    });
    
    // Create PDF with A4 dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10; // 10mm margin on all sides
    const contentWidth = pdfWidth - (2 * margin);
    const contentHeight = pdfHeight - (2 * margin);
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    // Calculate dimensions to fit within A4 page with margins
    let width = contentWidth;
    let height = contentWidth / ratio;
    
    // If content is too tall, scale it down to fit on one page
    if (height > contentHeight) {
      height = contentHeight;
      width = contentHeight * ratio;
    }
    
    // Center the content on the page
    const x = margin + (contentWidth - width) / 2;
    const y = margin + (contentHeight - height) / 2;
    
    // Add the image to PDF, ensuring it fits on one page
    pdf.addImage(imgData, 'PNG', x, y, width, height, undefined, 'FAST');
    
    // Download the PDF
    pdf.save(filename);
    
    return pdf;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Export the function that ViewQuotation expects
export const generateQuotationPDF = async (quotation: any, customer: any, items: any[]) => {
  const filename = `quotation-${quotation.reference_number}.pdf`;
  return captureViewAsPDF('quotation-view', filename, {
    backgroundColor: '#ffffff',
    scale: 2.5
  });
};

// Export function for invoices
export const generateInvoicePDF = async (invoice: any, customer: any, items: any[]) => {
  const filename = `invoice-${invoice.reference_number}.pdf`;
  return captureViewAsPDF('quotation-view', filename, {
    backgroundColor: '#ffffff',
    scale: 2.5
  });
};
