
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2, MoreHorizontal, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { invoiceService } from "@/services";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/utils/formatters";

export default function Invoices() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await invoiceService.getAll();
        setInvoices(data || []);
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

  const handleView = (invoiceId: string) => {
    navigate(`/invoices/view/${invoiceId}`);
  };

  const handleEdit = (invoiceId: string) => {
    navigate(`/invoices/edit/${invoiceId}`);
  };

  const handleDelete = async (invoiceId: string) => {
    try {
      await invoiceService.delete(invoiceId);
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
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

  const handlePaymentReceipts = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}/receipts`);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      Draft: "bg-gray-100 text-gray-800",
      Sent: "bg-blue-100 text-blue-800",
      Paid: "bg-green-100 text-green-800",
      Overdue: "bg-red-100 text-red-800",
    };
    
    return (
      <Badge className={statusColors[status] || statusColors.Draft}>
        {status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusColors = {
      Unpaid: "bg-red-100 text-red-800",
      Partial: "bg-yellow-100 text-yellow-800",
      Paid: "bg-green-100 text-green-800",
    };
    
    return (
      <Badge className={statusColors[paymentStatus] || statusColors.Unpaid}>
        {paymentStatus}
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
      header: "Due Date",
      accessorKey: "due_date",
      cell: ({ row }) => new Date(row.getValue("due_date")).toLocaleDateString(),
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
      header: "Payment",
      accessorKey: "payment_status",
      cell: ({ row }) => getPaymentStatusBadge(row.getValue("payment_status")),
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const invoice = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(invoice.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(invoice.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePaymentReceipts(invoice.id)}>
                <Receipt className="mr-2 h-4 w-4" />
                Payment Receipts
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={() => handleDelete(invoice.id)}
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
        <PageHeader title="Invoices" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }

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

      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={invoices}
            emptyMessage="No invoices found. Create your first invoice to get started."
          />
        </CardContent>
      </Card>
    </div>
  );
}
