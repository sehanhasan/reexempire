
import { useState, useEffect } from "react";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { invoiceService, customerService, quotationService, paymentReceiptService } from "@/services";
import { Customer, Invoice } from "@/types/database";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentReceiptUpload } from "@/components/payments/PaymentReceiptUpload";
import { PaymentReceiptsList } from "@/components/payments/PaymentReceiptsList";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExtendedInvoice extends Invoice {
  subject?: string | null;
}

export default function ViewInvoice() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotationRef, setQuotationRef] = useState<string | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [paymentReceipts, setPaymentReceipts] = useState<any[]>([]);

  const [groupedItems, setGroupedItems] = useState<{ [key: string]: any[] }>({});
  const [orderedCategories, setOrderedCategories] = useState<string[]>([]);

  const handleReceiptUploaded = (receipt: any) => {
    setPaymentReceipts(prev => [...prev, receipt]);
    toast({
      title: "Receipt Uploaded",
      description: "Your payment receipt has been uploaded successfully.",
    });
  };

  useEffect(() => {
    if (!id) return;

    const fetchInvoiceData = async () => {
      try {
        setIsLoading(true);

        const invoiceData = await invoiceService.getById(id) as ExtendedInvoice;
        if (invoiceData) {
          setInvoice(invoiceData);

          // Fetch customer data
          if (invoiceData.customer_id) {
            const customerData = await customerService.getById(invoiceData.customer_id);
            setCustomer(customerData);
          }

          // Fetch quotation reference if available
          if (invoiceData.quotation_id) {
            const quotationData = await quotationService.getById(invoiceData.quotation_id);
            setQuotationRef(quotationData?.reference_number || null);
          }

          // Fetch invoice images
          const invoiceImages = await invoiceService.getInvoiceImages(id);
          setImages(invoiceImages || []);

          // Fetch payment receipts
          const receipts = await paymentReceiptService.getReceiptsByInvoiceId(id);
          setPaymentReceipts(receipts || []);

          // Fetch invoice items and group by category
          const invoiceItems = await invoiceService.getItemsByInvoiceId(id);
          if (invoiceItems && invoiceItems.length > 0) {
            const grouped: { [key: string]: any[] } = {};
            const ordered: string[] = [];

            invoiceItems.forEach(item => {
              const category = (item.category && item.category.trim()) || 'Other Items';
              if (!grouped[category]) {
                grouped[category] = [];
                ordered.push(category);
              }
              grouped[category].push(item);
            });

            setGroupedItems(grouped);
            setOrderedCategories(ordered);
          }
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast({
          title: "Error",
          description: "Failed to fetch invoice data. Please try again.",
          variant: "destructive"
        });
        navigate("/invoices");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id, navigate]);

  if (isLoading || !invoice) {
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
            Invoice #{invoice.reference_number}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm mt-1">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              invoice.status === 'Sent' ? 'bg-yellow-100 text-yellow-800' :
              invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {invoice.status}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              invoice.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
              invoice.payment_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {invoice.payment_status}
            </span>
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
          
          {/* Right: Customer and Invoice Details */}
          <div className="space-y-4">
            {/* Customer Information */}
            <div className="bg-blue-50 p-3 rounded">
              <h3 className="font-bold text-blue-700 text-sm mb-2">BILL TO:</h3>
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
              {invoice.subject && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="font-semibold text-blue-700 text-xs">Subject:</div>
                  <div className="text-sm">{invoice.subject}</div>
                </div>
              )}
            </div>

            {/* Invoice Details */}
            <div className="text-sm space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-semibold">Invoice Date:</span></div>
                <div>{formatDate(invoice.issue_date)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-semibold">Due Date:</span></div>
                <div>{formatDate(invoice.due_date)}</div>
              </div>
              {quotationRef && (
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="font-semibold">Quotation Ref:</span></div>
                  <div>{quotationRef}</div>
                </div>
              )}
              {invoice.is_deposit_invoice && (
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="font-semibold text-orange-600">Deposit Invoice:</span></div>
                  <div className="text-orange-600">Yes ({invoice.deposit_percentage}%)</div>
                </div>
              )}
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
                    <span>RM {invoice.subtotal.toFixed(2)}</span>
                  </div>

                  {invoice.is_deposit_invoice && (
                    <div className="border-t pt-2 space-y-1">
                      <div className="flex justify-between text-xs text-orange-600">
                        <span>Deposit Amount ({invoice.deposit_percentage}%):</span>
                        <span>RM {(invoice.deposit_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Balance Due (Future Invoice):</span>
                        <span>RM {(invoice.subtotal - (invoice.deposit_amount || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between py-2 border-t font-bold">
                    <span>Total:</span>
                    <span>RM {invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images Section */}
        {images.length > 0 && (
          <Card className="mb-4 print:mb-3 print:shadow-none">
            <CardContent className="p-4 print:p-3">
              <h3 className="font-bold text-blue-700 mb-3 text-sm">WORK PHOTOS:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2">
                {images.map((image, index) => (
                  <div key={index} className="border rounded overflow-hidden">
                    <img 
                      src={image.image_url} 
                      alt={`Work photo ${index + 1}`} 
                      className="w-full h-32 object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="space-y-4 mb-6">
            {invoice.notes && (
              <div className="text-sm">
                <h3 className="font-bold text-blue-700 mb-2">NOTES:</h3>
                <div className="whitespace-pre-wrap">{invoice.notes}</div>
              </div>
            )}
            
            {invoice.terms && (
              <div className="text-sm">
                <h3 className="font-bold text-blue-700 mb-2">TERMS & CONDITIONS:</h3>
                <div className="whitespace-pre-wrap">{invoice.terms}</div>
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

        {/* Payment Upload Section */}
        {invoice.payment_status !== 'Paid' && (
          <div className="mt-8 print:hidden">
            <PaymentReceiptUpload 
              invoiceId={invoice.id} 
              onReceiptUploaded={handleReceiptUploaded}
            />
          </div>
        )}

        {/* Payment Receipts */}
        {paymentReceipts.length > 0 && (
          <div className="mt-6">
            <PaymentReceiptsList receipts={paymentReceipts} />
          </div>
        )}
      </div>
    </div>
  );
}
