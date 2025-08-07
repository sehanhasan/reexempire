
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
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Use the mobile app friendly format: wa.me/{phone}?text=
  const encodedMessage = encodeURIComponent(message);
  
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  } else {
    // Fallback to text-only if no phone number
    return `https://wa.me/?text=${encodedMessage}`;
  }
};

export const shareQuotation = async (quotationId: string, referenceNumber: string, customerName: string, customerPhone?: string): Promise<void> => {
  const quotationUrl = `${window.location.origin}/quotations/view/${quotationId}`;
  
  const message = `Dear ${customerName},\n\nPlease find your quotation ${referenceNumber} for review at the link below: ${quotationUrl}\n\nYou can review the quotation details and accept it online with your signature.\n\nIf you have any questions, please don't hesitate to contact us.\n\nThank you,\nReex Empire Sdn Bhd`;
  
  // Try to get customer phone number and open WhatsApp directly
  const whatsappUrl = generateWhatsAppUrl(customerPhone || '', message);
  
  // Open WhatsApp directly for mobile apps
  if (isMobileApp()) {
    window.open(whatsappUrl, '_blank');
    return;
  }

  // For web, use the share API
  const shareData: ShareData = {
    title: `Quotation #${referenceNumber}`,
    text: `Quotation #${referenceNumber} for ${customerName}`,
    url: quotationUrl
  };

  await shareContent(shareData);
};

export const shareInvoice = async (invoiceId: string, referenceNumber: string, customerName: string, customerPhone?: string): Promise<void> => {
  const invoiceUrl = `${window.location.origin}/invoices/view/${invoiceId}`;
  
  const message = `Dear ${customerName},\n\nPlease find your invoice ${referenceNumber} at the link below: ${invoiceUrl}\n\nIf you have any questions, please don't hesitate to contact us.\n\nThank you,\nReex Empire Sdn Bhd`;
  
  // Try to get customer phone number and open WhatsApp directly
  const whatsappUrl = generateWhatsAppUrl(customerPhone || '', message);
  
  // Open WhatsApp directly for mobile apps
  if (isMobileApp()) {
    window.open(whatsappUrl, '_blank');
    return;
  }

  // For web, use the share API
  const shareData: ShareData = {
    title: `Invoice #${referenceNumber}`,
    text: `Invoice #${referenceNumber} for ${customerName}`,
    url: invoiceUrl
  };

  await shareContent(shareData);
};
