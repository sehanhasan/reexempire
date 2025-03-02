
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
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

interface Invoice {
  id: string;
  customer: string;
  unitNumber: string;
  service: string;
  amount: string;
  date: string;
  dueDate: string;
  status: "Paid" | "Unpaid" | "Overdue" | "Draft";
}

export default function Invoices() {
  const navigate = useNavigate();
  
  // Mock data - would come from API in real app
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: "INV-001", customer: "Jane Cooper", unitNumber: "A-12-10", service: "Bathroom Renovation", amount: "RM 4,500.00", date: "Sep 12, 2023", dueDate: "Oct 12, 2023", status: "Paid" },
    { id: "INV-002", customer: "Robert Fox", unitNumber: "B-07-15", service: "Kitchen Remodel", amount: "RM 12,350.00", date: "Sep 10, 2023", dueDate: "Oct 10, 2023", status: "Unpaid" },
    { id: "INV-003", customer: "Cody Fisher", unitNumber: "C-03-22", service: "Flooring Installation", amount: "RM 2,800.00", date: "Sep 8, 2023", dueDate: "Oct 8, 2023", status: "Overdue" },
    { id: "INV-004", customer: "Esther Howard", unitNumber: "A-09-05", service: "Roof Repair", amount: "RM 1,800.00", date: "Sep 5, 2023", dueDate: "Oct 5, 2023", status: "Paid" },
    { id: "INV-005", customer: "Wade Warren", unitNumber: "B-15-18", service: "Deck Construction", amount: "RM 5,600.00", date: "Sep 3, 2023", dueDate: "Oct 3, 2023", status: "Unpaid" },
    { id: "INV-006", customer: "Brooklyn Simmons", unitNumber: "C-21-01", service: "Painting Services", amount: "RM 1,200.00", date: "Aug 29, 2023", dueDate: "Sep 29, 2023", status: "Draft" },
    { id: "INV-007", customer: "Cameron Williamson", unitNumber: "A-06-11", service: "Electrical Wiring", amount: "RM 2,300.00", date: "Aug 25, 2023", dueDate: "Sep 25, 2023", status: "Overdue" },
  ]);

  // Action handlers
  const handleView = (invoice: Invoice) => {
    toast({
      title: "Viewing Invoice",
      description: `Viewing details for invoice ${invoice.id} - ${invoice.service}`,
    });
  };

  const handleEdit = (invoice: Invoice) => {
    navigate(`/invoices/create?id=${invoice.id}`);
  };

  const handleDownload = (invoice: Invoice) => {
    toast({
      title: "Invoice Downloaded",
      description: `Invoice ${invoice.id} has been downloaded`,
    });
  };

  const handleSend = (invoice: Invoice) => {
    // Update the invoice status if it's a draft
    if (invoice.status === "Draft") {
      const updatedInvoices = invoices.map(inv => 
        inv.id === invoice.id ? { ...inv, status: "Unpaid" as const } : inv
      );
      setInvoices(updatedInvoices);
    }
    
    toast({
      title: "Invoice Sent",
      description: `Invoice ${invoice.id} has been sent to ${invoice.customer}`,
    });
  };

  const handleDelete = (invoice: Invoice) => {
    // Remove the invoice from the list
    setInvoices(invoices.filter(inv => inv.id !== invoice.id));
    
    toast({
      title: "Invoice Deleted",
      description: `Invoice ${invoice.id} has been deleted`,
      variant: "destructive",
    });
  };

  const handleMarkAsPaid = (invoice: Invoice) => {
    // Update the invoice status to "Paid"
    const updatedInvoices = invoices.map(inv => 
      inv.id === invoice.id ? { ...inv, status: "Paid" as const } : inv
    );
    setInvoices(updatedInvoices);
    
    toast({
      title: "Payment Recorded",
      description: `Invoice ${invoice.id} has been marked as paid`,
      variant: "default",
    });
  };

  const columns = [
    {
      header: "ID",
      accessorKey: "id" as keyof Invoice,
    },
    {
      header: "Unit #",
      accessorKey: "unitNumber" as keyof Invoice,
    },
    {
      header: "Amount",
      accessorKey: "amount" as keyof Invoice,
    },
    {
      header: "Issue Date",
      accessorKey: "date" as keyof Invoice,
    },
    {
      header: "Due Date",
      accessorKey: "dueDate" as keyof Invoice,
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Invoice,
      cell: (invoice: Invoice) => {
        return (
          <Badge className={
            invoice.status === "Paid" ? "bg-green-100 text-green-800 hover:bg-green-200" :
            invoice.status === "Unpaid" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" :
            invoice.status === "Draft" ? "bg-gray-100 text-gray-800 hover:bg-gray-200" :
            "bg-red-100 text-red-800 hover:bg-red-200"
          }>
            {invoice.status}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Invoice,
      cell: (invoice: Invoice) => {
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
              {(invoice.status === "Draft" || invoice.status === "Unpaid") && (
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleSend(invoice)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </DropdownMenuItem>
              )}
              {(invoice.status === "Unpaid" || invoice.status === "Overdue") && (
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
          searchKey="unitNumber" 
        />
      </div>

      <FloatingActionButton onClick={() => navigate("/invoices/create")} />
    </div>
  );
}
