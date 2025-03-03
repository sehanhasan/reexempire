
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { 
  Edit, 
  File, 
  MoreHorizontal, 
  Send,
  Trash,
  Eye,
  Download,
  Receipt,
  RefreshCw
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { quotationService, customerService } from "@/services";
import { format } from "date-fns";
import { Quotation, Customer } from "@/types/database";

interface QuotationWithCustomer extends Quotation {
  customer_name: string;
  unit_number: string | null;
}

export default function Quotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<QuotationWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const data = await quotationService.getAll();
      
      // Fetch customer details for each quotation
      const quotationsWithCustomers = await Promise.all(
        data.map(async (quotation) => {
          let customerName = "Unknown";
          let unitNumber = null;
          
          try {
            const customer = await customerService.getById(quotation.customer_id);
            if (customer) {
              customerName = customer.name;
              unitNumber = customer.unit_number;
            }
          } catch (error) {
            console.error(`Error fetching customer for quotation ${quotation.id}:`, error);
          }
          
          return {
            ...quotation,
            customer_name: customerName,
            unit_number: unitNumber
          };
        })
      );
      
      setQuotations(quotationsWithCustomers);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch quotations. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    fetchQuotations();
  }, []);

  // Action handlers
  const handleView = (quotation: QuotationWithCustomer) => {
    toast({
      title: "Viewing Quotation",
      description: `Viewing details for quotation ${quotation.reference_number}`,
    });
  };

  const handleEdit = (quotation: QuotationWithCustomer) => {
    navigate(`/quotations/edit?id=${quotation.id}`);
  };

  const handleDownload = (quotation: QuotationWithCustomer) => {
    toast({
      title: "Quotation Downloaded",
      description: `Quotation ${quotation.reference_number} has been downloaded`,
    });
  };

  const handleSend = (quotation: QuotationWithCustomer) => {
    // Update the quotation status if it's a draft
    if (quotation.status === "Draft") {
      const updateQuotation = async () => {
        try {
          await quotationService.update(quotation.id, { status: "Sent" });
          fetchQuotations(); // Refresh the list
        } catch (error) {
          console.error("Error updating quotation:", error);
        }
      };
      
      updateQuotation();
    }
    
    toast({
      title: "Quotation Sent",
      description: `Quotation ${quotation.reference_number} has been sent to ${quotation.customer_name}`,
    });
  };

  const handleDelete = (quotation: QuotationWithCustomer) => {
    const deleteQuotation = async () => {
      try {
        await quotationService.delete(quotation.id);
        // Remove the quotation from the list
        setQuotations(quotations.filter(q => q.id !== quotation.id));
        
        toast({
          title: "Quotation Deleted",
          description: `Quotation ${quotation.reference_number} has been deleted`,
          variant: "destructive",
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
    
    deleteQuotation();
  };

  const handleConvertToInvoice = (quotation: QuotationWithCustomer) => {
    navigate("/invoices/create", { state: { quotationId: quotation.id } });
  };

  const handleMarkAsAccepted = (quotation: QuotationWithCustomer) => {
    const updateQuotation = async () => {
      try {
        await quotationService.update(quotation.id, { status: "Accepted" });
        fetchQuotations(); // Refresh the list
        
        toast({
          title: "Quotation Accepted",
          description: `Quotation ${quotation.reference_number} has been marked as accepted`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error updating quotation:", error);
        toast({
          title: "Error",
          description: "Failed to update quotation. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    updateQuotation();
  };

  const handleMarkAsRejected = (quotation: QuotationWithCustomer) => {
    const updateQuotation = async () => {
      try {
        await quotationService.update(quotation.id, { status: "Rejected" });
        fetchQuotations(); // Refresh the list
        
        toast({
          title: "Quotation Rejected",
          description: `Quotation ${quotation.reference_number} has been marked as rejected`,
          variant: "destructive",
        });
      } catch (error) {
        console.error("Error updating quotation:", error);
        toast({
          title: "Error",
          description: "Failed to update quotation. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    updateQuotation();
  };

  // Define columns for the DataTable
  const columns: Column<QuotationWithCustomer>[] = [
    {
      header: "ID",
      accessorKey: "reference_number",
    },
    {
      header: "Unit #",
      accessorKey: "unit_number",
      cell: (quotation) => quotation.unit_number || "N/A",
    },
    {
      header: "Customer",
      accessorKey: "customer_name",
    },
    {
      header: "Amount",
      accessorKey: "total",
      cell: (quotation) => `RM ${parseFloat(quotation.total.toString()).toFixed(2)}`,
    },
    {
      header: "Issue Date",
      accessorKey: "issue_date",
      cell: (quotation) => format(new Date(quotation.issue_date), "MMM dd, yyyy"),
    },
    {
      header: "Valid Until",
      accessorKey: "expiry_date",
      cell: (quotation) => format(new Date(quotation.expiry_date), "MMM dd, yyyy"),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (quotation) => {
        const status = quotation.status;
        return (
          <Badge className={
            status === "Accepted" ? "bg-green-100 text-green-800 hover:bg-green-200" :
            status === "Sent" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" :
            status === "Draft" ? "bg-gray-100 text-gray-800 hover:bg-gray-200" :
            "bg-red-100 text-red-800 hover:bg-red-200"
          }>
            {status}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id", // We need to specify a key even for action columns
      cell: (quotation) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleView(quotation)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {quotation.status === "Draft" && (
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleEdit(quotation)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleDownload(quotation)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              {quotation.status === "Draft" && (
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleSend(quotation)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </DropdownMenuItem>
              )}
              {quotation.status === "Sent" && (
                <>
                  <DropdownMenuItem 
                    className="cursor-pointer text-green-600"
                    onClick={() => handleMarkAsAccepted(quotation)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Mark as Accepted
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600"
                    onClick={() => handleMarkAsRejected(quotation)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Mark as Rejected
                  </DropdownMenuItem>
                </>
              )}
              {quotation.status === "Accepted" && (
                <DropdownMenuItem 
                  className="cursor-pointer text-blue-600"
                  onClick={() => handleConvertToInvoice(quotation)}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Convert to Invoice
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={() => handleDelete(quotation)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Quotations" 
        description="Manage quotations and track their status."
        actions={
          <Button className="flex items-center" onClick={() => navigate("/quotations/create")}>
            <File className="mr-2 h-4 w-4" />
            Create Quotation
          </Button>
        }
      />
      
      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={quotations} 
          searchKey="unit_number" 
          isLoading={isLoading}
        />
      </div>

      <FloatingActionButton onClick={() => navigate("/quotations/create")} />
    </div>
  );
}
