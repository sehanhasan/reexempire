
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
    
    // Hide print-hidden elements
    const printHiddenElements = element.querySelectorAll('.print\\:hidden');
    printHiddenElements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
    
    // Force white background and remove any background colors
    const originalStyles = new Map<HTMLElement, string>();
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style.backgroundColor) {
        originalStyles.set(htmlEl, htmlEl.style.backgroundColor);
        htmlEl.style.backgroundColor = 'white';
      }
    });
    
    // Set the main element background to white
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = 'white';
    
    // Default options for high quality capture
    const defaultOptions = {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true,
      scrollX: 0,
      scrollY: 0,
      width: element.scrollWidth,
      height: element.scrollHeight,
      ...options
    };

    // Capture the element as canvas
    const canvas = await html2canvas(element, defaultOptions);
    
    // Restore original styles
    element.style.backgroundColor = originalBg;
    originalStyles.forEach((originalBg, el) => {
      el.style.backgroundColor = originalBg;
    });
    
    // Restore print-hidden elements
    printHiddenElements.forEach(el => {
      (el as HTMLElement).style.display = '';
    });
    
    // Create PDF with A4 dimensions
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 15; // 15mm margin on all sides
    const contentWidth = pdfWidth - (2 * margin);
    const contentHeight = pdfHeight - (2 * margin);
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    // Calculate dimensions to fit within content area
    let width = contentWidth;
    let height = contentWidth / ratio;
    
    // If height exceeds one page, handle multi-page
    if (height > contentHeight) {
      // Calculate how many pages we need
      const pagesNeeded = Math.ceil(height / contentHeight);
      const pageHeight = contentHeight;
      
      for (let i = 0; i < pagesNeeded; i++) {
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
          // Fill with white background
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, imgWidth, sourceHeight);
          
          const img = new Image();
          img.onload = () => {
            pageCtx.drawImage(img, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
            
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
          img.src = imgData;
        }
      }
    } else {
      // Single page - center the content
      const x = margin + (contentWidth - width) / 2;
      const y = margin + (contentHeight - height) / 2;
      
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
  return captureViewAsPDF('quotation-view', filename, {
    backgroundColor: '#ffffff',
    scale: 2
  });
};
