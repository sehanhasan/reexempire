
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

export const shareViaWhatsApp = (message: string): void => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

export const shareQuotation = async (quotationId: string, referenceNumber: string, customerName: string): Promise<void> => {
  const quotationUrl = `${window.location.origin}/quotations/view/${quotationId}`;
  
  const shareData: ShareData = {
    title: `Quotation #${referenceNumber}`,
    text: `Quotation #${referenceNumber} for ${customerName}`,
    url: quotationUrl
  };

  await shareContent(shareData);
};

export const shareInvoice = async (invoiceId: string, referenceNumber: string, customerName: string): Promise<void> => {
  const invoiceUrl = `${window.location.origin}/invoices/view/${invoiceId}`;
  
  const shareData: ShareData = {
    title: `Invoice #${referenceNumber}`,
    text: `Invoice #${referenceNumber} for ${customerName}`,
    url: invoiceUrl
  };

  await shareContent(shareData);
};
