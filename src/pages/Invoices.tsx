
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { 
  Eye, 
  Edit, 
  MoreHorizontal, 
  CreditCard, 
  CalendarClock, 
  Download,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { invoiceService, customerService, exportService } from "@/services";
import { format } from "date-fns";

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [invoicesData, customersData] = await Promise.all([
          invoiceService.getAll(),
          customerService.getAll()
        ]);
        
        // Create a map of customers for easy lookup
        const customersMap = {};
        customersData.forEach(customer => {
          customersMap[customer.id] = customer;
        });
        
        setCustomers(customersMap);
        setInvoices(invoicesData);
        setFilteredData(invoicesData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load invoices. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handlePaymentStatusChange = async (invoice, newStatus) => {
    try {
      await invoiceService.update(invoice.id, { payment_status: newStatus });
      
      // Update local state
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => 
          inv.id === invoice.id ? { ...inv, payment_status: newStatus } : inv
        )
      );
      
      toast({
        title: "Status Updated",
        description: `Invoice #${invoice.reference_number} marked as ${newStatus}`
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };
  
  const formatMoney = amount => {
    return `RM ${parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleSearch = (searchTerm, data) => {
    setFilteredData(data);
  };

  const exportInvoices = () => {
    try {
      // Prepare data for export - transform to more readable format
      const exportData = filteredData.map(invoice => {
        const customer = customers[invoice.customer_id] || {};
        return {
          'Invoice #': invoice.reference_number,
          'Customer': customer.name || 'Unknown',
          'Issue Date': format(new Date(invoice.issue_date), 'yyyy-MM-dd'),
          'Due Date': format(new Date(invoice.due_date), 'yyyy-MM-dd'),
          'Subtotal': parseFloat(invoice.subtotal).toFixed(2),
          'Tax': parseFloat(invoice.tax_amount).toFixed(2),
          'Total': parseFloat(invoice.total).toFixed(2),
          'Status': invoice.status,
          'Payment Status': invoice.payment_status
        };
      });
      
      // Export to CSV
      exportService.exportToCSV(exportData, 'invoices');
      
      toast({
        title: "Export Complete",
        description: `${exportData.length} invoices exported to CSV file`,
      });
    } catch (error) {
      console.error("Error exporting invoices:", error);
      toast({
        title: "Export Failed",
        description: "Could not export invoices to CSV",
        variant: "destructive",
      });
    }
  };
  
  const columns = [
    {
      header: "Invoice #",
      accessorKey: "reference_number",
      cell: ({ row }) => (
        <div 
          className="font-medium cursor-pointer text-blue-600"
          onClick={() => navigate(`/invoices/edit/${row.original.id}`)}
        >
          {row.original.reference_number}
        </div>
      ),
    },
    {
      header: "Customer",
      accessorKey: "customer_id",
      cell: ({ row }) => {
        const customer = customers[row.original.customer_id];
        return customer ? customer.name : "Unknown";
      },
    },
    {
      header: "Issue Date",
      accessorKey: "issue_date",
      cell: ({ row }) => format(new Date(row.original.issue_date), "MMM dd, yyyy"),
    },
    {
      header: "Due Date",
      accessorKey: "due_date",
      cell: ({ row }) => {
        const dueDate = new Date(row.original.due_date);
        const today = new Date();
        const isPastDue = dueDate < today && row.original.payment_status !== "Paid";
        
        return (
          <div className="flex items-center">
            <span className={isPastDue ? "text-red-600 font-medium" : ""}>
              {format(dueDate, "MMM dd, yyyy")}
            </span>
            {isPastDue && (
              <Badge variant="outline" className="ml-2 bg-red-50 text-red-600 border-red-200">
                Overdue
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: "Amount",
      accessorKey: "total",
      cell: ({ row }) => (
        <div className="font-medium">
          {formatMoney(row.original.total)}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "payment_status",
      cell: ({ row }) => {
        const status = row.original.payment_status;
        return (
          <Badge className={
            status === "Paid" ? "bg-green-100 text-green-800" :
            status === "Partially Paid" ? "bg-amber-100 text-amber-800" :
            "bg-red-100 text-red-800"
          }>
            {status}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const invoice = row.original;
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
                onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => navigate(`/invoices/edit/${invoice.id}?mode=edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {invoice.payment_status !== "Paid" && (
                <DropdownMenuItem 
                  className="cursor-pointer text-green-600"
                  onClick={() => handlePaymentStatusChange(invoice, "Paid")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Mark as Paid
                </DropdownMenuItem>
              )}
              {invoice.payment_status !== "Partially Paid" && (
                <DropdownMenuItem 
                  className="cursor-pointer text-amber-600"
                  onClick={() => handlePaymentStatusChange(invoice, "Partially Paid")}
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Mark as Partially Paid
                </DropdownMenuItem>
              )}
              {invoice.payment_status !== "Unpaid" && (
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600"
                  onClick={() => handlePaymentStatusChange(invoice, "Unpaid")}
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Mark as Unpaid
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Invoices" 
        description="Manage your invoice records"
        actions={
          <Button 
            variant="outline" 
            className="flex items-center" 
            onClick={exportInvoices}
          >
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        }
      />
      
      <div className="mt-6">
        <DataTable 
          columns={columns} 
          data={invoices} 
          searchKey="reference_number"
          isLoading={isLoading}
          onSearch={handleSearch}
        />
      </div>
      
      <FloatingActionButton 
        onClick={() => navigate("/invoices/create")} 
        icon={<Plus className="h-5 w-5" />}
      />
    </div>
  );
}
