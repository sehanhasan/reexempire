
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface QuotationPDFTemplateProps {
  quotation: any;
  customer: any;
  items: any[];
  signatureData?: string;
}

export const QuotationPDFTemplate: React.FC<QuotationPDFTemplateProps> = ({
  quotation,
  customer,
  items,
  signatureData
}) => {
  const isAccepted = quotation.status === 'Accepted';
  const hasSignature = signatureData || quotation.signature_data;

  const groupedItems: { [key: string]: any[] } = {};
  items.forEach((item) => {
    const category = item.category || 'Other Items';
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });

  const categories = Object.keys(groupedItems).sort();

  return (
    <div className="max-w-4xl mx-auto space-y-4 bg-white p-8" id="quotation-pdf-content">
      {/* Header with Company and Quotation Info */}
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
            {quotation.subject && (
              <div className="mt-3 pt-2 border-t">
                <p className="text-sm text-gray-800 font-semibold mb-1">Subject: {quotation.subject}</p>
              </div>
            )}
          </div>
          
          {/* Right Column - Quotation Details and Customer */}
          <div>
            <div className="mb-3">
              <h1 className="text-xl font-bold text-gray-900">Quotation #{quotation.reference_number}</h1>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="mb-1" variant={isAccepted ? "default" : "secondary"}>
                  {quotation.status}
                </Badge>
                {hasSignature && (
                  <Badge variant="outline" className="mb-1 bg-green-50 text-green-700 border-green-200 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Signed
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Issue Date:</strong> {formatDate(quotation.issue_date)}</p>
                <p><strong>Expiry Date:</strong> {formatDate(quotation.expiry_date)}</p>
              </div>
            </div>
            
            {customer && (
              <div className="w-64 bg-gray-100 p-3 rounded-lg text-sm">
                <p className="text-lg font-bold text-gray-500 font-medium mb-1">Bill To</p>
                <div className="text-sm text-gray-800 space-y-1">
                  <p>Attn: {customer.name}</p>
                  <p className="font-semibold">{customer.unit_number}</p>
                  <p>{customer.address}</p>
                </div>
              </div>
            )}
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
                  <th className="text-right p-2 font-semibold text-gray-700 w-16">Qty</th>
                  <th className="text-right p-2 font-semibold text-gray-700 w-24">Unit Price</th>
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
                    {groupedItems[category].map((item, index) => (
                      <tr key={`${category}-${index}`} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-gray-800">{item.description}</td>
                        <td className="text-right p-2 text-gray-800">{item.quantity}</td>
                        <td className="text-right p-2 text-gray-800">{item.unit_price.toFixed(2)}</td>
                        <td className="text-right p-2 font-semibold text-gray-800">{item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Subtotal, Deposit and Total Information */}
          <div className="p-3 bg-gray-50 border-t">
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span>{formatCurrency(quotation.subtotal)}</span>
                </div>
                
                {quotation.requires_deposit && (
                  <div className="flex justify-between">
                    <span className="font-medium">
                      Deposit ({quotation.deposit_percentage}%):
                    </span>
                    <span>{formatCurrency(quotation.deposit_amount || 0)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-base font-bold border-t pt-1">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatCurrency(quotation.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Bottom Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Terms & Conditions */}
          {quotation.terms && (
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Terms & Conditions</h4>
                <p className="text-sm whitespace-pre-wrap">{quotation.terms}</p>
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

        {/* Right Column - Signature Section */}
        <div>
          {hasSignature && (
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Customer Signature</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <img 
                    src={signatureData || quotation.signature_data} 
                    alt="Customer Signature" 
                    className="max-w-full h-auto border border-gray-200 rounded bg-white"
                    style={{ maxHeight: '150px' }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Signed digitally on {new Date().toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
