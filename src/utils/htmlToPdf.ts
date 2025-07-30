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
    
    // Default options
    const defaultOptions = {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      ...options
    };

    // Capture the element as canvas
    const canvas = await html2canvas(element, defaultOptions);
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Calculate dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    let width = pdfWidth;
    let height = pdfWidth / ratio;
    
    // If height exceeds page height, scale down
    if (height > pdfHeight) {
      height = pdfHeight;
      width = pdfHeight * ratio;
    }
    
    // Center the image on the page
    const x = (pdfWidth - width) / 2;
    const y = (pdfHeight - height) / 2;
    
    pdf.addImage(imgData, 'PNG', x, y, width, height);
    
    // Download the PDF
    pdf.save(filename);
    
    return pdf;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
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
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      pageHeight: 1122, // A4 height in pixels at 96 DPI
      ...options
    };

    // Capture the element as canvas
    const canvas = await html2canvas(element, defaultOptions);
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgData = canvas.toDataURL('image/png');
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
        
        const pageImgData = pageCanvas.toDataURL('image/png');
        
        // Calculate dimensions for PDF
        const ratio = imgWidth / sourceHeight;
        let width = pdfWidth;
        let height = pdfWidth / ratio;
        
        if (height > pdfHeight) {
          height = pdfHeight;
          width = pdfHeight * ratio;
        }
        
        const x = (pdfWidth - width) / 2;
        const y = 0;
        
        pdf.addImage(pageImgData, 'PNG', x, y, width, height);
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