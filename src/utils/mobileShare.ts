
// Mobile-friendly share utility for invoices and quotations
export interface ShareData {
  title: string;
  text: string;
  url: string;
}

export const isMobileApp = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for Capacitor
  if ((window as any).Capacitor) {
    return true;
  }
  
  // Check for mobile webview patterns
  const mobilePatterns = [
    /iPhone|iPad|iPod|Android/i,
    /Mobile|Tablet/i,
    /WebView/i,
    /wv/i // Android WebView
  ];
  
  return mobilePatterns.some(pattern => pattern.test(userAgent));
};

export const isIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const shareContent = async (shareData: ShareData): Promise<void> => {
  try {
    // 1. Try native Web Share API first (mobile browsers)
    if (navigator.share && isMobileApp()) {
      await navigator.share(shareData);
      return;
    }

    // 2. Try postMessage for iframe communication
    if (isIframe() && window.parent) {
      window.parent.postMessage({
        type: 'SHARE_CONTENT',
        data: shareData
      }, '*');
      return;
    }

    // 3. Fallback to clipboard
    await copyToClipboard(shareData.url);
    
    // Show success message or toast
    console.log('Link copied to clipboard:', shareData.url);
    
  } catch (error) {
    console.error('Share failed:', error);
    // Final fallback - copy to clipboard
    await copyToClipboard(shareData.url);
  }
};

const copyToClipboard = async (text: string): Promise<void> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw error;
  }
};

const generateWhatsAppUrl = (phoneNumber: string, message: string): string => {
  // Use the iframe-friendly format: https://api.whatsapp.com/send?text=
  const encodedMessage = encodeURIComponent(message);
  
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
  } else {
    // Fallback to text-only if no phone number
    return `https://api.whatsapp.com/send?text=${encodedMessage}`;
  }
};

export const shareQuotation = async (quotationId: string, referenceNumber: string, customerName: string): Promise<void> => {
  const quotationUrl = `${window.location.origin}/quotations/view/${quotationId}`;
  
  try {
    // Generate PDF instead of sharing the public URL
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('generate-pdf', {
      body: {
        publicUrl: quotationUrl,
        documentId: quotationId,
        documentType: 'quotation'
      }
    });

    if (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    }

    if (!data.success || !data.pdfUrl) {
      throw new Error('PDF generation failed');
    }

    // Create WhatsApp message with PDF link and signature link
    const message = `Quotation #${referenceNumber} for ${customerName}\n\nPDF: ${data.pdfUrl}\n\nStart Digital Signature: ${quotationUrl}`;
    
    // Use iframe-friendly WhatsApp URL
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    
    // For iframes and mobile apps, open directly
    if (isMobileApp() || isIframe()) {
      window.location.href = whatsappUrl;
      return;
    }

    // For web, use the share API with PDF URL
    const shareData: ShareData = {
      title: `Quotation #${referenceNumber}`,
      text: `Quotation #${referenceNumber} for ${customerName} - PDF: ${data.pdfUrl}`,
      url: data.pdfUrl
    };

    await shareContent(shareData);
  } catch (error) {
    console.error('Error generating PDF, falling back to original URL:', error);
    
    // Fallback to original sharing method
    const message = `Quotation #${referenceNumber} for ${customerName}\n\nView: ${quotationUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    
    if (isMobileApp() || isIframe()) {
      window.location.href = whatsappUrl;
      return;
    }

    const shareData: ShareData = {
      title: `Quotation #${referenceNumber}`,
      text: `Quotation #${referenceNumber} for ${customerName}`,
      url: quotationUrl
    };

    await shareContent(shareData);
  }
};

export const shareInvoice = async (invoiceId: string, referenceNumber: string, customerName: string): Promise<void> => {
  const invoiceUrl = `${window.location.origin}/invoices/view/${invoiceId}`;
  
  try {
    // Generate PDF instead of sharing the public URL
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('generate-pdf', {
      body: {
        publicUrl: invoiceUrl,
        documentId: invoiceId,
        documentType: 'invoice'
      }
    });

    if (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    }

    if (!data.success || !data.pdfUrl) {
      throw new Error('PDF generation failed');
    }

    // Create WhatsApp message with PDF link and signature link
    const message = `Invoice #${referenceNumber} for ${customerName}\n\nPDF: ${data.pdfUrl}\n\nStart Digital Signature: ${invoiceUrl}`;
    
    // Use iframe-friendly WhatsApp URL
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    
    // For iframes and mobile apps, open directly
    if (isMobileApp() || isIframe()) {
      window.location.href = whatsappUrl;
      return;
    }

    // For web, use the share API with PDF URL
    const shareData: ShareData = {
      title: `Invoice #${referenceNumber}`,
      text: `Invoice #${referenceNumber} for ${customerName} - PDF: ${data.pdfUrl}`,
      url: data.pdfUrl
    };

    await shareContent(shareData);
  } catch (error) {
    console.error('Error generating PDF, falling back to original URL:', error);
    
    // Fallback to original sharing method
    const message = `Invoice #${referenceNumber} for ${customerName}\n\nView: ${invoiceUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    
    if (isMobileApp() || isIframe()) {
      window.location.href = whatsappUrl;
      return;
    }

    const shareData: ShareData = {
      title: `Invoice #${referenceNumber}`,
      text: `Invoice #${referenceNumber} for ${customerName}`,
      url: invoiceUrl
    };

    await shareContent(shareData);
  }
};
