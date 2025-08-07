
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { invoiceService, customerService } from "@/services";
import { Invoice, Customer, InvoiceItem } from "@/types/database";
import { shareInvoice } from "@/utils/mobileShare";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import { formatCurrency } from "@/utils/formatters";

export default function ViewInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = await invoiceService.getById(id!);
      const itemsData = await invoiceService.getItemsByInvoiceId(id!);
      const imagesData = await invoiceService.getInvoiceImages(id!);
      
      if (invoiceData) {
        setInvoice(invoiceData);
        setItems(itemsData || []);
        setImages(imagesData.map(img => img.image_url) || []);
        
        if (invoiceData.customer_id) {
          const customerData = await customerService.getById(invoiceData.customer_id);
          setCustomer(customerData);
        }
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!invoice || !customer) return;
    
    try {
      await shareInvoice(invoice.id, invoice.reference_number, customer.name);
    } catch (error) {
      console.error("Error sharing invoice:", error);
      toast({
        title: "Error",
        description: "Failed to share invoice",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice || !customer) return;
    
    try {
      await generateInvoicePDF(invoice, customer, items, images);
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Sent":
        return "secondary";
      case "Overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Partial":
        return "secondary";
      default:
        return "destructive";
    }
  };

  // Group items by category with index
  const groupedItems = items.reduce((acc, item, index) => {
    const category = item.category || "Other Items";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, InvoiceItem[]>);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading invoice details...</div>
        </div>
      </div>
    );
  }

  if (!invoice || !customer) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Invoice not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.reference_number}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant={getStatusBadgeVariant(invoice.status)}>
                {invoice.status}
              </Badge>
              <Badge variant={getPaymentStatusBadgeVariant(invoice.payment_status)}>
                {invoice.payment_status}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="space-y-6">
        {/* Customer & Invoice Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill To</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold">{customer.name}</p>
                {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
                {customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
                {customer.address && (
                  <div className="text-sm text-gray-600">
                    <p>{customer.address}</p>
                    {(customer.city || customer.state || customer.postal_code) && (
                      <p>
                        {[customer.city, customer.state, customer.postal_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Invoice Number:</span>
                  <span className="font-semibold">{invoice.reference_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Issue Date:</span>
                  <span>{new Date(invoice.issue_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
                {invoice.quotation_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quotation Ref:</span>
                    <span>{invoice.quotation_id}</span>
                  </div>
                )}
                {invoice.is_deposit_invoice && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Deposit ({invoice.deposit_percentage}%):</span>
                    <span className="font-semibold">{formatCurrency(invoice.deposit_amount || 0)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, categoryItems], categoryIndex) => (
                <div key={category} className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    {categoryIndex + 1}- {category}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Description</th>
                          <th className="text-center py-2">Qty</th>
                          <th className="text-center py-2">Unit</th>
                          <th className="text-right py-2">Unit Price</th>
                          <th className="text-right py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryItems.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-2">{item.description}</td>
                            <td className="text-center py-2">{item.quantity}</td>
                            <td className="text-center py-2">{item.unit}</td>
                            <td className="text-right py-2">{formatCurrency(item.unit_price)}</td>
                            <td className="text-right py-2">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({invoice.tax_rate}%):</span>
                  <span>{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Photos */}
        {images && images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Work Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((imageUrl, index) => (
                  <div key={index} className="aspect-square">
                    <img 
                      src={imageUrl} 
                      alt={`Work photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-md border"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <AdditionalInfoCard 
          subject={invoice.subject}
          terms={invoice.terms}
        />
      </div>
    </div>
  );
}
