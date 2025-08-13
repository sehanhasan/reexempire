
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import { toast } from "@/components/ui/use-toast";
import { invoiceService } from "@/services";
import { Invoice } from "@/types/database";
import { columns } from "@/components/invoices/columns";
import { Plus, Share2, FileDown, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { downloadPDF } from "@/utils/pdfGenerator";

export default function Invoices() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const data = await invoiceService.getAll();
        setInvoices(data);
      } catch (error) {
        console.error("Error fetching invoices:", error);
        toast({
          title: "Error",
          description: "Failed to fetch invoices. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    
    try {
      await invoiceService.delete(id);
      setInvoices(invoices.filter(invoice => invoice.id !== id));
      toast({
        title: "Invoice Deleted",
        description: "Invoice has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendWhatsapp = (invoice: Invoice) => {
    if (!invoice.customers?.name) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const whatsappUrl = invoiceService.generateWhatsAppShareUrl(
        invoice.id,
        invoice.reference_number,
        invoice.customers.name
      );
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    if (!invoice.customers) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const items = await invoiceService.getItemsByInvoiceId(invoice.id);
      
      const invoiceDetails = {
        documentNumber: invoice.reference_number,
        documentDate: invoice.issue_date,
        dueDate: invoice.due_date,
        customerName: invoice.customers.name,
        customerAddress: invoice.customers.address || '',
        customerContact: invoice.customers.phone || '',
        customerEmail: invoice.customers.email || '',
        unitNumber: invoice.customers.unit_number || '',
        subject: invoice.subject || '',
        notes: invoice.notes || '',
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unit_price,
          amount: item.amount,
          category: item.category
        })),
        quotationRefNumber: invoice.quotation_ref_number
      };

      await downloadPDF('invoice', invoiceDetails);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="page-container">
        <PageHeader title="Invoices" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>;
  }

  const data = invoices.map((invoice) => ({
    ...invoice,
    actions: (
      <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
        <Button size="sm" variant="outline" onClick={() => handleSendWhatsapp(invoice)}>
          <Share2 className="mr-2 h-4 w-4" />
          WhatsApp
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(invoice)}>
          <FileDown className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button size="sm" variant="destructive" onClick={() => handleDelete(invoice.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    ),
  }));

  return (
    <div className="page-container">
      <PageHeader
        title="Invoices"
        actions={
          <Button onClick={() => navigate("/invoices/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        }
      />
      <DataTable columns={columns} data={data} />
    </div>
  );
}
