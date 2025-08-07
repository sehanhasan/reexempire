
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2, CheckCircle2, XCircle, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InvoiceItemsTable } from "@/components/invoices/InvoiceItemsTable";
import { CustomerInfo } from "@/components/customers/CustomerInfo";
import { ShareDocument } from "@/components/common/ShareDocument";
import { toast } from "@/components/ui/use-toast";
import { invoiceService, customerService, exportService } from "@/services";
import { Invoice, Customer } from "@/types/database";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExtendedInvoice extends Invoice {
  customer?: Customer;
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    amount: number;
    category?: string;
  }>;
  images?: string[];
}

export default function ViewInvoice() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [invoice, setInvoice] = useState<ExtendedInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoiceData();
    }
  }, [id]);

  const fetchInvoiceData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const invoiceData = await invoiceService.getById(id);
      
      if (invoiceData && invoiceData.customer) {
        const items = await invoiceService.getItemsByInvoiceId(id);
        const images = await invoiceService.getImages(id);
        
        setInvoice({
          ...invoiceData,
          items: items || [],
          images: images || []
        });
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice data.",
        variant: "destructive"
      });
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!invoice || !invoice.customer) {
      toast({
        title: "Error",
        description: "Invoice data not available for export.",
        variant: "destructive"
      });
      return;
    }

    try {
      await exportService.exportInvoiceToPDF(invoice, invoice.customer, invoice.items || []);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'default';
      case 'sent':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPaymentStatusBadgeVariant = (paymentStatus: string) => {
    switch (paymentStatus.toLowerCase()) {
      case 'paid':
        return 'default';
      case 'partial':
        return 'secondary';
      case 'unpaid':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageHeader title="View Invoice" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }

  if (!invoice || !invoice.customer) {
    return (
      <div className="page-container">
        <PageHeader title="Invoice Not Found" />
        <div className="text-center">
          <p>Invoice not found or customer information is missing.</p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/invoices")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title={`Invoice ${invoice.reference_number}`}
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        }
      />

      <div className="mt-8 space-y-6">
        {/* Invoice Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="text-2xl">Invoice {invoice.reference_number}</CardTitle>
                <p className="text-muted-foreground">
                  Issued on {formatDate(invoice.issue_date)}
                </p>
                {invoice.due_date && (
                  <p className="text-muted-foreground">
                    Due date: {formatDate(invoice.due_date)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Badge variant={getStatusBadgeVariant(invoice.status)}>
                  {invoice.status}
                </Badge>
                <Badge variant={getPaymentStatusBadgeVariant(invoice.payment_status)}>
                  {invoice.payment_status}
                </Badge>
                {invoice.is_deposit_invoice && (
                  <Badge variant="outline">Deposit Invoice</Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Customer Information */}
        <CustomerInfo customer={invoice.customer} />

        {/* Subject */}
        {invoice.subject && (
          <Card>
            <CardHeader>
              <CardTitle>Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{invoice.subject}</p>
            </CardContent>
          </Card>
        )}

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceItemsTable items={invoice.items || []} />
          </CardContent>
        </Card>

        {/* Images */}
        {invoice.images && invoice.images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Work Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {invoice.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Work photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md border"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.is_deposit_invoice && (
                <>
                  <div className="flex justify-between">
                    <span>Deposit ({invoice.deposit_percentage}%):</span>
                    <span>{formatCurrency(invoice.deposit_amount || 0)}</span>
                  </div>
                </>
              )}
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({invoice.tax_rate}%):</span>
                  <span>{invoice.tax_amount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <ShareDocument
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        documentType="invoice"
        documentId={id!}
        referenceNumber={invoice.reference_number}
        customerName={invoice.customer?.name || ''}
      />
    </div>
  );
}
