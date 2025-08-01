
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
    const element = document.getElementById(elementId) || document.body;
    
    // Hide print-hidden elements
    const printHiddenElements = element.querySelectorAll('.print\\:hidden');
    printHiddenElements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
    
    // Default options for high quality capture
    const defaultOptions = {
      scale: 3, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      ...options
    };

    // Capture the element as canvas
    const canvas = await html2canvas(element, defaultOptions);
    
    // Restore print-hidden elements
    printHiddenElements.forEach(el => {
      (el as HTMLElement).style.display = '';
    });
    
    // Create PDF with A4 dimensions
    const pdf = new jsPDF('p', 'mm', 'a4');
    
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
    
    // Calculate dimensions to fit within content area
    let width = contentWidth;
    let height = contentWidth / ratio;
    
    // If height exceeds content height, scale down
    if (height > contentHeight) {
      height = contentHeight;
      width = contentHeight * ratio;
    }
    
    // Center the content within the page
    const x = margin + (contentWidth - width) / 2;
    const y = margin + (contentHeight - height) / 2;
    
    // Handle multi-page content
    if (height > contentHeight) {
      // Calculate pages needed
      const pageHeight = contentHeight;
      const totalPages = Math.ceil(height / pageHeight);
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        // Calculate the source region for this page
        const sourceY = (i * pageHeight * imgHeight) / height;
        const sourceHeight = Math.min((pageHeight * imgHeight) / height, imgHeight - sourceY);
        
        // Create a temporary canvas for this page section
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidth;
        pageCanvas.height = sourceHeight;
        
        const pageCtx = pageCanvas.getContext('2d');
        if (pageCtx) {
          const tempImg = new Image();
          tempImg.onload = () => {
            pageCtx.drawImage(tempImg, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
            
            const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
            const pageRatio = imgWidth / sourceHeight;
            
            let pageImgWidth = contentWidth;
            let pageImgHeight = contentWidth / pageRatio;
            
            if (pageImgHeight > pageHeight) {
              pageImgHeight = pageHeight;
              pageImgWidth = pageHeight * pageRatio;
            }
            
            const pageX = margin + (contentWidth - pageImgWidth) / 2;
            const pageY = margin;
            
            pdf.addImage(pageImgData, 'PNG', pageX, pageY, pageImgWidth, pageImgHeight, undefined, 'FAST');
          };
          tempImg.src = imgData;
        }
      }
    } else {
      pdf.addImage(imgData, 'PNG', x, y, width, height, undefined, 'FAST');
    }
    
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
  return captureViewAsPDF('quotation-view', filename);
};

export const captureMultiPageViewAsPDF = async (
  elementId: string,
  filename: string,
  options: {
    scale?: number;
    useCORS?: boolean;
    allowTaint?: boolean;
    backgroundColor?: string;
    pageHeight?: number;
  } = {}
) => {
  try {
    const element = document.getElementById(elementId) || document.body;
    
    // Default options
    const defaultOptions = {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      pageHeight: 1122, // A4 height in pixels at 96 DPI
      ...options
    };

    // Capture the element as canvas
    const canvas = await html2canvas(element, defaultOptions);
    
    // Create PDF with proper A4 format
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const margin = 10; // 10mm margin
    const contentWidth = pdfWidth - (2 * margin);
    const contentHeight = pdfHeight - (2 * margin);
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Calculate how many pages we need
    const pageHeightInCanvas = (defaultOptions.pageHeight * defaultOptions.scale);
    const totalPages = Math.ceil(imgHeight / pageHeightInCanvas);
    
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      // Calculate the portion of the image to use for this page
      const sourceY = i * pageHeightInCanvas;
      const sourceHeight = Math.min(pageHeightInCanvas, imgHeight - sourceY);
      
      // Create a temporary canvas for this page
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = sourceHeight;
      
      const pageCtx = pageCanvas.getContext('2d');
      if (!pageCtx) continue;
      
      // Draw the portion of the main canvas onto the page canvas
      const img = new Image();
      img.onload = () => {
        pageCtx.drawImage(img, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
        
        const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
        
        // Calculate dimensions for PDF with proper margins
        const ratio = imgWidth / sourceHeight;
        let width = contentWidth;
        let height = contentWidth / ratio;
        
        if (height > contentHeight) {
          height = contentHeight;
          width = contentHeight * ratio;
        }
        
        const x = margin + (contentWidth - width) / 2;
        const y = margin;
        
        pdf.addImage(pageImgData, 'PNG', x, y, width, height, undefined, 'FAST');
      };
      img.src = imgData;
    }
    
    // Download the PDF
    pdf.save(filename);
    
    return pdf;
  } catch (error) {
    console.error('Error generating multi-page PDF:', error);
    throw error;
  }
};
