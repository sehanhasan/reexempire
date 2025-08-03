
export const generateWhatsAppInvoiceLink = (
  customerPhone: string,
  invoiceNumber: string,
  customerName: string,
  total: number,
  dueDate: string,
  viewLink: string
) => {
  const formatPhone = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '60' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('60')) {
      cleanPhone = '60' + cleanPhone;
    }
    return cleanPhone;
  };

  const formattedPhone = formatPhone(customerPhone);
  const formattedTotal = `RM ${total.toFixed(2)}`;
  
  const message = `Hi ${customerName},

Your invoice is ready! 📄

📋 Invoice: #${invoiceNumber}
💰 Amount: ${formattedTotal}
📅 Due Date: ${dueDate}

You can view and download your invoice here:
${viewLink}

Thank you for your business!

Best regards,
Reex Empire Sdn Bhd`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

export const generateWhatsAppQuotationLink = (
  customerPhone: string,
  quotationNumber: string,
  customerName: string,
  total: number,
  expiryDate: string,
  viewLink: string
) => {
  const formatPhone = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '60' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('60')) {
      cleanPhone = '60' + cleanPhone;
    }
    return cleanPhone;
  };

  const formattedPhone = formatPhone(customerPhone);
  const formattedTotal = `RM ${total.toFixed(2)}`;
  
  const message = `Hi ${customerName},

Your quotation is ready! 📋

🔢 Quotation: #${quotationNumber}
💰 Amount: ${formattedTotal}
⏰ Valid Until: ${expiryDate}

You can view and accept your quotation here:
${viewLink}

Please review and let us know if you have any questions.

Best regards,
Reex Empire Sdn Bhd`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};
