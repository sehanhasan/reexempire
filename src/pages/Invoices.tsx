
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
  Receipt, 
  MoreHorizontal, 
  Send,
  Trash,
  Eye,
  Download
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { invoiceService, customerService } from "@/services";
import { format } from "date-fns";
import { Invoice, Customer } from "@/types/database";

interface InvoiceWithCustomer extends Invoice {
  customer_name: string;
  unit_number: string | null;
}

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await invoiceService.getAll();
      
      // Fetch customer details for each invoice
      const invoicesWithCustomers = await Promise.all(
        data.map(async (invoice) => {
          let customerName = "Unknown";
          let unitNumber = null;
          
          try {
            const customer = await customerService.getById(invoice.customer_id);
            if (customer) {
              customerName = customer.name;
              unitNumber = customer.unit_number;
            }
          } catch (error) {
            console.error(`Error fetching customer for invoice ${invoice.id}:`, error);
          }
          
          return {
            ...invoice,
            customer_name: customerName,
            unit_number: unitNumber
          };
        })
      );
      
      setInvoices(invoicesWithCustomers);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch invoices. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Action handlers
  const handleView = (invoice: InvoiceWithCustomer) => {
    toast({
      title: "Viewing Invoice",
      description: `Viewing details for invoice ${invoice.reference_number}`,
    });
  };

  const handleEdit = (invoice: InvoiceWithCustomer) => {
    navigate(`/invoices/edit?id=${invoice.id}`);
  };

  const handleDownload = (invoice: InvoiceWithCustomer) => {
    toast({
      title: "Invoice Downloaded",
      description: `Invoice ${invoice.reference_number} has been downloaded`,
    });
  };

  const handleSend = (invoice: InvoiceWithCustomer) => {
    // Update the invoice status if it's a draft
    if (invoice.status === "Draft") {
      const updateInvoice = async () => {
        try {
          await invoiceService.update(invoice.id, { 
            status: "Sent",
            payment_status: "Unpaid"
          });
          fetchInvoices(); // Refresh the list
        } catch (error) {
          console.error("Error updating invoice:", error);
        }
      };
      
      updateInvoice();
    }
    
    toast({
      title: "Invoice Sent",
      description: `Invoice ${invoice.reference_number} has been sent to ${invoice.customer_name}`,
    });
  };

  const handleDelete = (invoice: InvoiceWithCustomer) => {
    const deleteInvoice = async () => {
      try {
        await invoiceService.delete(invoice.id);
        // Remove the invoice from the list
        setInvoices(invoices.filter(inv => inv.id !== invoice.id));
        
        toast({
          title: "Invoice Deleted",
          description: `Invoice ${invoice.reference_number} has been deleted`,
          variant: "destructive",
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
    
    deleteInvoice();
  };

  const handleMarkAsPaid = (invoice: InvoiceWithCustomer) => {
    // Update the invoice status to "Paid"
    const updateInvoice = async () => {
      try {
        await invoiceService.update(invoice.id, { payment_status: "Paid" });
        fetchInvoices(); // Refresh the list
        
        toast({
          title: "Payment Recorded",
          description: `Invoice ${invoice.reference_number} has been marked as paid`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error updating invoice:", error);
        toast({
          title: "Error",
          description: "Failed to update invoice. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    updateInvoice();
  };

  // Define columns for the DataTable
  const columns: Column<InvoiceWithCustomer>[] = [
    {
      header: "ID",
      accessorKey: "reference_number",
    },
    {
      header: "Unit #",
      accessorKey: "unit_number",
      cell: (invoice) => invoice.unit_number || "N/A",
    },
    {
      header: "Amount",
      accessorKey: "total",
      cell: (invoice) => `RM ${parseFloat(invoice.total.toString()).toFixed(2)}`,
    },
    {
      header: "Issue Date",
      accessorKey: "issue_date",
      cell: (invoice) => format(new Date(invoice.issue_date), "MMM dd, yyyy"),
    },
    {
      header: "Due Date",
      accessorKey: "due_date",
      cell: (invoice) => format(new Date(invoice.due_date), "MMM dd, yyyy"),
    },
    {
      header: "Status",
      accessorKey: "payment_status",
      cell: (invoice) => {
        const status = invoice.payment_status;
        return (
          <Badge className={
            status === "Paid" ? "bg-green-100 text-green-800 hover:bg-green-200" :
            status === "Unpaid" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" :
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
      cell: (invoice) => {
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
                onClick={() => handleView(invoice)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {invoice.status === "Draft" && (
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleEdit(invoice)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleDownload(invoice)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              {(invoice.status === "Draft" || invoice.payment_status === "Unpaid") && (
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleSend(invoice)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </DropdownMenuItem>
              )}
              {(invoice.payment_status === "Unpaid" || invoice.payment_status === "Overdue") && (
                <DropdownMenuItem 
                  className="cursor-pointer text-green-600"
                  onClick={() => handleMarkAsPaid(invoice)}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Mark as Paid
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={() => handleDelete(invoice)}
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
        title="Invoices" 
        description="Manage invoices and track payments."
        actions={
          <Button className="flex items-center" onClick={() => navigate("/invoices/create")}>
            <Receipt className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        }
      />
      
      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={invoices} 
          searchKey="unit_number" 
          isLoading={isLoading}
        />
      </div>

      <FloatingActionButton onClick={() => navigate("/invoices/create")} />
    </div>
  );
}
