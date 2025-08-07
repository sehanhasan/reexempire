import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download, Share2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { invoiceService, exportService } from "@/services";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Invoice, InvoiceItem, InvoiceImage } from "@/types/database";
import { InvoiceItemsTable } from "@/components/invoices/InvoiceItemsTable";
import { CustomerInfo } from "@/components/customers/CustomerInfo";
import { ShareDocument } from "@/components/common/ShareDocument";

export default function ViewInvoice() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [images, setImages] = useState<InvoiceImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const shareDocument = ShareDocument();

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;

      try {
        const invoiceData = await invoiceService.getById(invoiceId);
        if (invoiceData) {
          setInvoice(invoiceData);
        }

        const imagesData = await invoiceService.getImages(invoiceId);
        if (imagesData) {
          setImages(imagesData);
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast({
          title: "Error",
          description: "Failed to fetch invoice details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const handleShare = () => {
    if (!invoice) return;
    
    const viewUrl = `${window.location.origin}/invoices/view/${invoice.id}`;
    const message = `Invoice ${invoice.reference_number} - ${formatCurrency(invoice.total)}`;
    
    shareDocument(viewUrl, message);
  };

  const handleDownload = async () => {
    if (!invoice) return;

    try {
      const invoiceDetails = {
        ...invoice,
        items: items,
        images: images,
      };

      await exportService.exportInvoiceToPDF(invoiceDetails);
      
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="View Invoice" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="page-container">
        <PageHeader title="View Invoice" />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Invoice not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="View Invoice"
        actions={
          <div className="space-x-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Reference
                  </p>
                  <p className="text-lg font-semibold">{invoice.reference_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <p className="text-lg font-semibold">{invoice.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Issue Date
                  </p>
                  <p>{formatDate(invoice.issue_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Due Date
                  </p>
                  <p>{formatDate(invoice.due_date)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Notes
                </p>
                <p>{invoice.notes || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Terms
                </p>
                <p>{invoice.terms || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceItemsTable invoiceId={invoiceId} />
            </CardContent>
          </Card>
        </div>

        <div>
          <CustomerInfo customer={(invoice as any)?.customer} />
        </div>
      </div>
    </div>
  );
}
