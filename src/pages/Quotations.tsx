
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import { toast } from "@/components/ui/use-toast";
import { MoreHorizontal, Pencil, Copy, Trash2, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { quotationService } from "@/services";
import { Quotation } from "@/types/database";
import { columns } from "@/components/quotations/columns";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateQuotationPDF, downloadPDF } from "@/utils/pdfGenerator";

export default function Quotations() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setIsLoading(true);
        const data = await quotationService.getAll();
        setQuotations(data);
      } catch (error) {
        console.error("Error fetching quotations:", error);
        toast({
          title: "Error",
          description: "Failed to fetch quotations. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this quotation?")) return;

    try {
      await quotationService.delete(id);
      setQuotations(quotations.filter(quotation => quotation.id !== id));
      toast({
        title: "Quotation Deleted",
        description: "Quotation has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to delete quotation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (quotation: Quotation) => {
    try {
      const newReferenceNumber = await quotationService.generateNextReferenceNumber();
      const duplicatedQuotation = {
        ...quotation,
        id: undefined,
        reference_number: newReferenceNumber,
        status: 'Draft',
        created_at: undefined,
        updated_at: undefined,
      };

      const createdQuotation = await quotationService.create(duplicatedQuotation);

      // Fetch and duplicate items
      const items = await quotationService.getItemsByQuotationId(quotation.id);
      if (items && items.length > 0) {
        for (const item of items) {
          await quotationService.createItem({
            quotation_id: createdQuotation.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            amount: item.amount,
            category: item.category
          });
        }
      }

      setQuotations([createdQuotation, ...quotations]);
      toast({
        title: "Quotation Duplicated",
        description: "Quotation has been duplicated successfully.",
      });
    } catch (error) {
      console.error("Error duplicating quotation:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate quotation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendWhatsapp = (quotation: Quotation) => {
    if (!quotation.customers?.name) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const whatsappUrl = quotationService.generateWhatsAppShareUrl(
        quotation.id,
        quotation.reference_number,
        quotation.customers.name
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

  const handleDownloadPDF = async (quotation: Quotation) => {
    if (!quotation.customers) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const items = await quotationService.getItemsByQuotationId(quotation.id);
      
      const quotationDetails = {
        documentNumber: quotation.reference_number,
        documentDate: quotation.issue_date,
        customerName: quotation.customers.name,
        customerAddress: quotation.customers.address || '',
        customerContact: quotation.customers.phone || '',
        customerEmail: quotation.customers.email || '',
        unitNumber: quotation.customers.unit_number || '',
        expiryDate: quotation.expiry_date,
        validUntil: quotation.expiry_date,
        subject: quotation.subject || '',
        notes: quotation.notes || '',
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unit_price,
          amount: item.amount,
          category: item.category
        })),
        depositInfo: {
          requiresDeposit: quotation.requires_deposit || false,
          depositAmount: quotation.deposit_amount || 0,
          depositPercentage: quotation.deposit_percentage || 0
        }
      };

      await downloadPDF('quotation', quotationDetails);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const actions = (quotation: Quotation) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate(`/quotations/edit/${quotation.id}`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDuplicate(quotation)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSendWhatsapp(quotation)}>
          <Share2 className="mr-2 h-4 w-4" />
          Share via WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownloadPDF(quotation)}>
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDelete(quotation.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const columnsWithActions = [
    ...columns,
    {
      id: "actions",
      header: "",
      cell: ({ row }) => actions(row.original),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Quotations"
        description="Manage your quotations"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button onClick={() => navigate("/quotations/create")}>
              Create Quotation
            </Button>
          </div>
        }
      />
      <div className="container mx-auto py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : (
          <DataTable columns={columnsWithActions} data={quotations} />
        )}
      </div>
    </div>
  );
}
