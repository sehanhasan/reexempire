
export const generateWhatsAppShareUrl = (
  documentId: string,
  documentNumber: string,
  customerName: string,
  previewUrl: string,
  documentType: 'quotation' | 'invoice'
): string => {
  const message = `Dear ${customerName},\n\n` +
    `Please find your ${documentType} ${documentNumber} for review at the link below: ` +
    `${previewUrl}\n\n` +
    `You can review the ${documentType} details ${documentType === 'quotation' ? 'and accept it online with your signature' : 'and make payment if required'}.\n\n` +
    `If you have any questions, please don't hesitate to contact us.\n\n` +
    `Thank you,\nReex Empire Sdn Bhd`;
  
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};
