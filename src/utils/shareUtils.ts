
interface ShareData {
  title: string;
  text: string;
  url?: string;
}

export const shareContent = async (data: ShareData): Promise<boolean> => {
  try {
    // Check if we're in an iframe
    const isInIframe = window.self !== window.top;
    
    // Try native Web Share API first (works on mobile)
    if (navigator.share) {
      await navigator.share(data);
      return true;
    }
    
    // If in iframe or mobile app, use postMessage to parent
    if (isInIframe) {
      window.parent.postMessage({
        type: 'SHARE_CONTENT',
        data: data
      }, '*');
      return true;
    }
    
    // Fallback to clipboard
    const shareText = `${data.title}\n\n${data.text}${data.url ? `\n\n${data.url}` : ''}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareText);
      return true;
    }
    
    // Final fallback - create temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = shareText;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    return true;
  } catch (error) {
    console.error('Error sharing content:', error);
    return false;
  }
};

export const shareQuotation = (quotation: any, customer: any) => {
  const shareData = {
    title: `Quotation #${quotation.reference_number}`,
    text: `Please review your quotation from Reex Empire Sdn Bhd\n\nCustomer: ${customer?.name || 'N/A'}\nTotal: RM ${quotation.total.toFixed(2)}\nExpiry: ${new Date(quotation.expiry_date).toLocaleDateString()}`,
    url: window.location.href
  };
  
  return shareContent(shareData);
};

export const shareInvoice = (invoice: any, customer: any) => {
  const shareData = {
    title: `Invoice #${invoice.reference_number}`,
    text: `Your invoice from Reex Empire Sdn Bhd\n\nCustomer: ${customer?.name || 'N/A'}\nTotal: RM ${invoice.total.toFixed(2)}\nDue: ${new Date(invoice.due_date).toLocaleDateString()}`,
    url: window.location.href
  };
  
  return shareContent(shareData);
};
