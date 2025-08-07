
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2, Printer } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { invoiceService } from "@/services";
import { formatCurrency } from "@/utils/formatters";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import { shareInvoice } from "@/utils/mobileShare";

interface Invoice {
  id: string;
  reference_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  subject: string | null;
  is_deposit_invoice: boolean;
  deposit_amount: number;
  deposit_percentage: number;
  payment_status: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  category: string;
}

interface InvoiceImage {
  id: string;
  image_url: string;
  uploaded_at: string;
}

export default function ViewInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [images, setImages] = useState<InvoiceImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchInvoiceData = async () => {
      try {
        setIsLoading(true);
        const invoiceData = await invoiceService.getById(id);
        setInvoice(invoiceData);

        const itemsData = await invoiceService.getItemsByInvoiceId(id);
        setItems(itemsData || []);

        const imagesData = await invoiceService.getInvoiceImages(id);
        setImages(imagesData || []);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast({
          title: "Error",
          description: "Failed to fetch invoice data. Please try again.",
          variant: "destructive"
        });
        navigate("/invoices");
      }
    };

    fetchInvoiceData();
  }, [id, navigate]);

  const handleShare = async () => {
    if (!invoice) {
      toast({
        title: "Error",
        description: "Invoice data not available for sharing.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await shareInvoice(invoice.id, invoice.reference_number, invoice.customer.name);
      toast({
        title: "Share Successful",
        description: "Invoice has been shared successfully.",
      });
    } catch (error) {
      console.error("Error sharing invoice:", error);
      toast({
        title: "Share Failed",
        description: "Failed to share invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    try {
      const invoiceData = {
        ...invoice,
        items: items,
        images: images
      };
      await generateInvoicePDF(invoiceData);
      toast({
        title: "PDF Downloaded",
        description: "Invoice PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice not found</h1>
          <Button onClick={() => navigate("/invoices")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-[800px] bg-gray-50" style={{ minWidth: "800px", zoom: 0.8 }}>
      {/* Header Actions - Print Hidden */}
      <div className="bg-white border-b border-gray-200 p-4 print:hidden">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto bg-white shadow-sm print:shadow-none print:max-w-none">
        <div className="p-8 print:p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
              <div className="text-sm text-gray-600">
                <p className="font-medium">Invoice #: {invoice.reference_number}</p>
                <p>Issue Date: {new Date(invoice.issue_date).toLocaleDateString()}</p>
                <p>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-700 mb-1">REEX EMPIRE SDN BHD</div>
              <div className="text-sm text-gray-600">
                <p>No. 42A-2, Jalan Kuchai Maju 2</p>
                <p>Kuchai Entrepreneurs Park</p>
                <p>58200 Kuala Lumpur, Malaysia</p>
                <p className="mt-2">
                  <strong>Tel:</strong> +60 17-292 2496<br />
                  <strong>Email:</strong> reexempire@gmail.com
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Bill To:</h3>
              <div className="text-sm text-gray-700">
                <p className="font-medium text-base">{invoice.customer.name}</p>
                <div className="whitespace-pre-line">{invoice.customer.address}</div>
                <p className="mt-2">
                  <strong>Phone:</strong> {invoice.customer.phone}<br />
                  <strong>Email:</strong> {invoice.customer.email}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Invoice Details:</h3>
              <div className="text-sm text-gray-700">
                <p><strong>Status:</strong> <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                  invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {invoice.status}
                </span></p>
                <p><strong>Payment Status:</strong> <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  invoice.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                  invoice.payment_status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {invoice.payment_status}
                </span></p>
                {invoice.subject && <p><strong>Subject:</strong> {invoice.subject}</p>}
                {invoice.is_deposit_invoice && (
                  <p><strong>Type:</strong> Deposit Invoice ({invoice.deposit_percentage}%)</p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <div className="overflow-hidden border border-gray-300">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-300">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm w-20">Qty</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm w-16">Unit</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm w-24">Unit Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4 text-sm">
                        <div className="font-medium text-gray-900">{item.description}</div>
                        {item.category && item.category !== 'Other Items' && (
                          <div className="text-xs text-gray-500 mt-1">{item.category}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm">{item.unit}</td>
                      <td className="py-3 px-4 text-sm text-right">{item.unit_price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Work Photos</h3>
              <div className="grid grid-cols-2 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="border border-gray-300 rounded overflow-hidden">
                    <img 
                      src={image.image_url} 
                      alt="Work photo"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="bg-gray-50 p-4 border border-gray-300">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.is_deposit_invoice && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Deposit ({invoice.deposit_percentage}%):</span>
                        <span className="font-medium">{formatCurrency(invoice.deposit_amount)}</span>
                      </div>
                      <hr className="border-gray-300" />
                    </>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                <div className="whitespace-pre-wrap">{invoice.notes}</div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
            <p>Thank you for your business!</p>
            <p className="mt-1">Please make payment by the due date specified above.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
