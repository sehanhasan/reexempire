
import { useState, useEffect } from 'react';
import React from 'react';
import { useParams } from 'react-router-dom';
import { quotationService, customerService } from '@/services';
import { Customer, Quotation } from '@/types/database';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatDate } from "@/utils/formatters";

interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  category: string;
}

interface ExtendedQuotation extends Omit<Quotation, 'terms'> {
  subject?: string | null;
  terms?: string | null;
  signature_data?: string | null;
  signed_at?: string | null;
}

export default function ViewQuotation() {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [quotation, setQuotation] = useState<ExtendedQuotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchQuotationData = async () => {
      setIsLoading(true);
      try {
        const quotationData = await quotationService.getById(id);
        if (quotationData) {
          setQuotation(quotationData as ExtendedQuotation);

          // Fetch customer details
          const customerData = await customerService.getById(quotationData.customer_id);
          setCustomer(customerData);

          // Fetch quotation items
          const quotationItems = await quotationService.getItemsByQuotationId(id);
          setItems(quotationItems as QuotationItem[]);
        }
      } catch (error) {
        console.error("Error fetching quotation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotationData();
  }, [id]);

  const groupItemsByCategory = () => {
    const groupedItems: { [key: string]: QuotationItem[] } = {};
    const orderedCategories: string[] = [];

    items.forEach(item => {
      const category = item.category || 'Other Items';
      if (!groupedItems[category]) {
        groupedItems[category] = [];
        orderedCategories.push(category);
      }
      groupedItems[category].push(item);
    });

    return { groupedItems, orderedCategories };
  };

  const { groupedItems, orderedCategories } = groupItemsByCategory();

  if (isLoading || !quotation) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4 py-2">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-700">
            Quotation #{quotation.reference_number}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm mt-1">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              quotation.status === 'Sent' ? 'bg-yellow-100 text-yellow-800' :
              quotation.status === 'Accepted' ? 'bg-green-100 text-green-800' :
              quotation.status === 'Rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {quotation.status}
            </span>
            {quotation.signed_at && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Signed
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.print()}
              className="ml-2"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 print:p-4">
        {/* Company Header - Two Columns */}
        <div className="grid grid-cols-2 gap-8 mb-6 print:mb-4">
          {/* Left: Company Logo and Details */}
          <div className="space-y-3">
            <img src="/placeholder.svg" alt="Reex Empire" className="h-16 w-auto" />
            <div className="text-sm space-y-1">
              <div className="font-bold text-blue-700 text-lg">REEX EMPIRE SDN BHD</div>
              <div>Company No: 202301040055 (1522955-A)</div>
              <div>84-G, Jalan Puteri 2/4, Bandar Puteri,</div>
              <div>47100 Puchong, Selangor</div>
            </div>
          </div>
          
          {/* Right: Customer and Quotation Details */}
          <div className="space-y-4">
            {/* Customer Information */}
            <div className="bg-blue-50 p-3 rounded">
              <h3 className="font-bold text-blue-700 text-sm mb-2">ATTN:</h3>
              <div className="text-sm space-y-1">
                <div className="font-semibold">{customer?.name}</div>
                {customer?.address && <div>{customer.address}</div>}
                {customer?.unit_number && <div>{customer.unit_number}</div>}
                {customer?.city && customer?.state && customer?.postal_code && (
                  <div>{customer.city}, {customer.state} {customer.postal_code}</div>
                )}
                {customer?.phone && <div>Tel: {customer.phone}</div>}
                {customer?.email && <div>Email: {customer.email}</div>}
              </div>
              {quotation.subject && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="font-semibold text-blue-700 text-xs">Subject:</div>
                  <div className="text-sm">{quotation.subject}</div>
                </div>
              )}
            </div>

            {/* Quotation Details */}
            <div className="text-sm space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-semibold">Date:</span></div>
                <div>{formatDate(quotation.issue_date)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-semibold">Valid Until:</span></div>
                <div>{formatDate(quotation.expiry_date)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <Card className="mb-4 print:mb-3 print:shadow-none">
          <CardContent className="p-4 print:p-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 w-8">#</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2 w-16">Qty</th>
                    <th className="text-right py-2 w-20">Unit Price</th>
                    <th className="text-right py-2 w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedCategories.map(category => (
                    <React.Fragment key={category}>
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="py-1 px-2 font-medium text-blue-600 text-xs border-t">
                          {category}
                        </td>
                      </tr>
                      {groupedItems[category].map((item, index) => (
                        <tr key={`${category}-${index}`} className="border-b border-gray-100">
                          <td className="py-2">{index + 1}</td>
                          <td className="py-2">{item.description}</td>
                          <td className="text-right py-2">{item.quantity} {item.unit}</td>
                          <td className="text-right py-2">{item.unit_price.toFixed(2)}</td>
                          <td className="text-right py-2">{item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mt-4">
              <div className="w-64">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between py-1">
                    <span>Subtotal:</span>
                    <span>RM {quotation.subtotal.toFixed(2)}</span>
                  </div>

                  {quotation.requires_deposit && (
                    <div className="border-t pt-2 space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Deposit ({quotation.deposit_percentage}%):</span>
                        <span>RM {(quotation.deposit_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Balance Due:</span>
                        <span>RM {(quotation.subtotal - (quotation.deposit_amount || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between py-2 border-t font-bold">
                    <span>Total:</span>
                    <span>RM {quotation.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes and Terms */}
        {(quotation.notes || quotation.terms) && (
          <div className="space-y-4 mb-6">
            {quotation.notes && (
              <div className="text-sm">
                <h3 className="font-bold text-blue-700 mb-2">NOTES:</h3>
                <div className="whitespace-pre-wrap">{quotation.notes}</div>
              </div>
            )}
            
            {quotation.terms && (
              <div className="text-sm">
                <h3 className="font-bold text-blue-700 mb-2">TERMS & CONDITIONS:</h3>
                <div className="whitespace-pre-wrap">{quotation.terms}</div>
              </div>
            )}
          </div>
        )}

        {/* Contact Information */}
        <div className="border-t pt-4 mt-6 text-center text-sm text-gray-600">
          <div>For all enquiries, please contact Khalil Pasha</div>
          <div>Email: reexsb@gmail.com</div>
          <div>Tel: 011-1665 6525 / 019-999 1024</div>
        </div>

        {quotation.signature_data && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-bold text-blue-700 mb-2 text-sm">CUSTOMER SIGNATURE:</h3>
            <div className="border rounded p-2 bg-gray-50 text-center">
              <img src={quotation.signature_data} alt="Customer Signature" className="max-h-20 mx-auto" />
              <div className="text-xs text-gray-600 mt-1">
                Signed on: {quotation.signed_at ? formatDate(quotation.signed_at.split('T')[0]) : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
