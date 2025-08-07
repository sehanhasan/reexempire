
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { quotationService } from "@/services";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/utils/formatters";

export default function Quotations() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const data = await quotationService.getAll();
        setQuotations(data || []);
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

  const handleView = (quotationId: string) => {
    navigate(`/quotations/view/${quotationId}`);
  };

  const handleEdit = (quotationId: string) => {
    navigate(`/quotations/edit/${quotationId}`);
  };

  const handleDelete = async (quotationId: string) => {
    try {
      await quotationService.delete(quotationId);
      setQuotations(quotations.filter(quotation => quotation.id !== quotationId));
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

  const handleCreateInvoice = (quotationId: string) => {
    navigate("/invoices/create", { state: { quotationId } });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      Draft: "bg-gray-100 text-gray-800",
      Sent: "bg-blue-100 text-blue-800",
      Accepted: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      Expired: "bg-orange-100 text-orange-800",
    };
    
    return (
      <Badge className={statusColors[status] || statusColors.Draft}>
        {status}
      </Badge>
    );
  };

  const columns = [
    {
      header: "Reference",
      accessorKey: "reference_number",
    },
    {
      header: "Customer",
      accessorKey: "customer.name",
    },
    {
      header: "Issue Date",
      accessorKey: "issue_date",
      cell: ({ row }) => new Date(row.getValue("issue_date")).toLocaleDateString(),
    },
    {
      header: "Expiry Date",
      accessorKey: "expiry_date",
      cell: ({ row }) => new Date(row.getValue("expiry_date")).toLocaleDateString(),
    },
    {
      header: "Amount",
      accessorKey: "total",
      cell: ({ row }) => formatCurrency(row.getValue("total")),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const quotation = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(quotation.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(quotation.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {quotation.status === "Accepted" && (
                <DropdownMenuItem onClick={() => handleCreateInvoice(quotation.id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Invoice
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={() => handleDelete(quotation.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Quotations" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Quotations"
        actions={
          <Button onClick={() => navigate("/quotations/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Quotation
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Quotations ({quotations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={quotations}
            emptyMessage="No quotations found. Create your first quotation to get started."
          />
        </CardContent>
      </Card>
    </div>
  );
}
