
export const shareInvoice = async (invoiceId: string, invoiceNumber: string, customerName: string) => {
  // Use permanent public URLs based on environment
  const baseUrl = window.location.hostname.includes('lovable.app') 
    ? 'https://reexempire.lovable.app'
    : window.location.origin;
  
  const invoiceUrl = `${baseUrl}/invoices/view/${invoiceId}`;
  
  const message = `Dear ${customerName},\n\n` +
    `Please find your invoice ${invoiceNumber} for review at the link below: ` +
    `${invoiceUrl}\n\n` +
    `You can review the invoice details and make payment.\n\n` +
    `If you have any questions, please don't hesitate to contact us.\n\n` +
    `Thank you,\nReex Empire Sdn Bhd`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Invoice ${invoiceNumber}`,
        text: message,
        url: invoiceUrl,
      });
    } catch (error) {
      console.log('Error sharing:', error);
      // Fallback to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  } else {
    // Fallback to WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
};

export const shareQuotation = async (quotationId: string, quotationNumber: string, customerName: string) => {
  // Use permanent public URLs based on environment
  const baseUrl = window.location.hostname.includes('lovable.app') 
    ? 'https://reexempire.lovable.app'
    : window.location.origin;
  
  const quotationUrl = `${baseUrl}/quotations/view/${quotationId}`;
  
  const message = `Dear ${customerName},\n\n` +
    `Please find your quotation ${quotationNumber} for review at the link below: ` +
    `${quotationUrl}\n\n` +
    `You can review the quotation details and accept or request changes.\n\n` +
    `If you have any questions, please don't hesitate to contact us.\n\n` +
    `Thank you,\nReex Empire Sdn Bhd`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Quotation ${quotationNumber}`,
        text: message,
        url: quotationUrl,
      });
    } catch (error) {
      console.log('Error sharing:', error);
      // Fallback to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  } else {
    // Fallback to WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
};
