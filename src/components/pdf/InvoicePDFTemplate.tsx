
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface InvoicePDFTemplateProps {
  invoice: any;
  customer: any;
  items: any[];
  images: any[];
}

export const InvoicePDFTemplate: React.FC<InvoicePDFTemplateProps> = ({
  invoice,
  customer,
  items,
  images
}) => {
  const formatMoney = (amount: any) =>
    `RM ${parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatAmount = (amount: any) =>
    parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getStatusColor = (status: string) => {
    if (status === "Paid")
      return "bg-green-100 text-green-800 hover:bg-green-100";
    if (status === "Partially Paid")
      return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    if (status === "Overdue")
      return "bg-red-100 text-red-600 hover:bg-red-100";
    return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  };

  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  const isPastDue = dueDate < today && invoice.payment_status !== "Paid";
  const displayPaymentStatus =
    isPastDue && invoice.payment_status === "Unpaid"
      ? "Overdue"
      : invoice.payment_status;

  const groupedItems: { [key: string]: any[] } = {};
  items.forEach((item) => {
    const category = item.category || "Other Items";
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });

  const categories = Object.keys(groupedItems).sort();

  return (
    <div className="max-w-4xl mx-auto space-y-4 bg-white p-8" id="invoice-pdf-content">
      {/* Header with Company and Invoice Info */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Company Logo and Details */}
          <div>
            <img 
              src="https://i.ibb.co/Ltyts5K/reex-empire-logo.png" 
              alt="Reex Empire Logo" 
              className="h-16 w-auto mb-3"
            />
            <h2 className="text-sm font-bold text-gray-900 mb-2">Reex Empire Sdn Bhd (1426553-A)</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>No. 29-1, Jalan 2A/6, Taman Setapak Indah</p>
              <p>53300 Setapak Kuala Lumpur</p>
              <p className="text-gray-800">www.reexempire.com</p>
            </div>
            {invoice.subject && (
              <div className="mt-3 pt-2 border-t">
                <p className="text-sm text-gray-800 font-semibold mb-1">Subject: {invoice.subject}</p>
              </div>
            )}
          </div>
          
          {/* Right Column - Invoice Details and Customer */}
          <div>
            <div className="mb-3">
              <h1 className="text-xl font-bold text-gray-900">Invoice #{invoice.reference_number}</h1>
              <Badge className={`mb-1 ${getStatusColor(displayPaymentStatus)}`}>
                {displayPaymentStatus}
              </Badge>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Issued:</strong> {format(new Date(invoice.issue_date), "MMM dd, yyyy")}</p>
                <p><strong>Due:</strong> {format(dueDate, "MMM dd, yyyy")}</p>
              </div>
            </div>
            
            <div className="w-64 bg-gray-100 p-3 rounded-lg text-sm">
              <p className="text-lg font-bold text-gray-500 font-medium mb-1">Bill To</p>
              <div className="text-sm text-gray-800 space-y-1">
                <p>Attn: {customer.name}</p>
                {customer.unit_number && <p className="font-semibold">{customer.unit_number}</p>}
                {customer.address && <p>{customer.address}</p>}
                {customer.city && <p>{customer.city}, {customer.state} {customer.postal_code}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2 font-semibold text-gray-700">Description</th>
                  <th className="text-right p-2 font-semibold text-gray-700 w-16">Price</th>
                  <th className="text-right p-2 font-semibold text-gray-700 w-16">Qty</th>
                  <th className="text-right p-2 font-semibold text-gray-700 w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, categoryIndex) => (
                  <React.Fragment key={category}>
                    <tr className="bg-blue-50 border-t border-b">
                      <td colSpan={4} className="p-2 font-semibold text-blue-800 text-sm">
                        {categoryIndex + 1}- {category}
                      </td>
                    </tr>
                    {groupedItems[category].map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-gray-800">{item.description}</td>
                        <td className="text-right p-2 text-gray-800">{formatAmount(item.unit_price)}</td>
                        <td className="text-right p-2 text-gray-800">{item.quantity}</td>
                        <td className="text-right p-2 font-semibold text-gray-800">{formatAmount(item.amount)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Subtotal and Total Information */}
          <div className="p-3 bg-gray-50 border-t">
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span>{formatMoney(invoice.subtotal)}</span>
                </div>
                {invoice.tax_rate > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium">Tax ({invoice.tax_rate}%):</span>
                    <span>{formatMoney(invoice.tax_amount)}</span>
                  </div>
                )}
                {invoice.is_deposit_invoice && (
                  <div className="flex justify-between">
                    <span className="font-medium">Deposit Amount:</span>
                    <span>{formatMoney(invoice.deposit_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t pt-1">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatMoney(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Photos */}
      {images.length > 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-base">Work Photos</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {images.map((image, index) => (
                <div key={image.id} className="relative">
                  <img 
                    src={image.image_url} 
                    alt={`Work photo ${index + 1}`} 
                    className="w-full h-24 object-cover rounded-md shadow-sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two-Column Bottom Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Payment Information Card */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-base">Payment Details</h3>
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <div className="space-y-1">
                  <p><strong>Company Name:</strong> Reex Empire Sdn Bhd</p>
                  <p><strong>Bank Name:</strong> Maybank</p>
                  <p><strong>Account No:</strong> 514897120482</p>
                  <p className="text-blue-700 font-medium mt-2">*Please include the invoice number on payment reference*</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Terms & Conditions */}
          {invoice.terms && (
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Terms & Conditions</h4>
                <p className="text-sm whitespace-pre-wrap">{invoice.terms}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Contact Info */}
          <div className="text-center text-gray-600 text-sm py-3 bg-gray-50 rounded-lg">
            <p>For all enquiries, please contact Khalil Pasha</p>
            <p>Email: reexsb@gmail.com Tel: 011-1665 6525 / 019-999 1024</p>
            <div className="text-center text-gray-500 text-xs py-3">
              <p>&copy; {new Date().getFullYear()} Reex Empire Sdn Bhd. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
