
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
  FileText, 
  MoreHorizontal, 
  Send,
  Trash,
  Eye,
  Receipt
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Quotation {
  id: string;
  customer: string;
  service: string;
  amount: string;
  date: string;
  status: "Draft" | "Sent" | "Approved" | "Rejected";
}

export default function Quotations() {
  const navigate = useNavigate();
  
  // Mock data - would come from API in real app
  const [quotations, setQuotations] = useState<Quotation[]>([
    { id: "QT-001", customer: "John Smith", service: "Bathroom Renovation", amount: "RM 4,500.00", date: "Sep 12, 2023", status: "Approved" },
    { id: "QT-002", customer: "Emma Johnson", service: "Kitchen Remodel", amount: "RM 12,350.00", date: "Sep 10, 2023", status: "Sent" },
    { id: "QT-003", customer: "Michael Brown", service: "Flooring Installation", amount: "RM 2,800.00", date: "Sep 8, 2023", status: "Draft" },
    { id: "QT-004", customer: "Lisa Davis", service: "Roof Repair", amount: "RM 1,800.00", date: "Sep 5, 2023", status: "Rejected" },
    { id: "QT-005", customer: "Robert Wilson", service: "Deck Construction", amount: "RM 5,600.00", date: "Sep 3, 2023", status: "Approved" },
    { id: "QT-006", customer: "Jennifer Garcia", service: "Painting Services", amount: "RM 1,200.00", date: "Aug 29, 2023", status: "Draft" },
    { id: "QT-007", customer: "David Martinez", service: "Electrical Wiring", amount: "RM 2,300.00", date: "Aug 25, 2023", status: "Sent" },
  ]);

  // Action handlers
  const handleView = (quotation: Quotation) => {
    toast({
      title: "Viewing Quotation",
      description: `Viewing details for quotation ${quotation.id} - ${quotation.service}`,
    });
  };

  const handleEdit = (quotation: Quotation) => {
    navigate(`/quotations/create?id=${quotation.id}`);
  };

  const handleSend = (quotation: Quotation) => {
    // Update the quotation status to "Sent"
    const updatedQuotations = quotations.map(q => 
      q.id === quotation.id ? { ...q, status: "Sent" as const } : q
    );
    setQuotations(updatedQuotations);
    
    toast({
      title: "Quotation Sent",
      description: `Quotation ${quotation.id} has been sent to ${quotation.customer}`,
    });
  };

  const handleDelete = (quotation: Quotation) => {
    // Remove the quotation from the list
    setQuotations(quotations.filter(q => q.id !== quotation.id));
    
    toast({
      title: "Quotation Deleted",
      description: `Quotation ${quotation.id} has been deleted`,
      variant: "destructive",
    });
  };

  const handleConvertToInvoice = (quotation: Quotation) => {
    toast({
      title: "Converting to Invoice",
      description: `Quotation ${quotation.id} is being converted to an invoice`,
    });
    navigate(`/invoices/create?from=${quotation.id}`);
  };

  const columns = [
    {
      header: "ID",
      accessorKey: "id" as keyof Quotation,
    },
    {
      header: "Customer",
      accessorKey: "customer" as keyof Quotation,
    },
    {
      header: "Service",
      accessorKey: "service" as keyof Quotation,
    },
    {
      header: "Amount",
      accessorKey: "amount" as keyof Quotation,
    },
    {
      header: "Date",
      accessorKey: "date" as keyof Quotation,
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Quotation,
      cell: (quotation: Quotation) => {
        return (
          <Badge className={
            quotation.status === "Approved" ? "bg-green-100 text-green-800 hover:bg-green-200" :
            quotation.status === "Sent" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
            quotation.status === "Draft" ? "bg-gray-100 text-gray-800 hover:bg-gray-200" :
            "bg-red-100 text-red-800 hover:bg-red-200"
          }>
            {quotation.status}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Quotation,
      cell: (quotation: Quotation) => {
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
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleEdit(quotation)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
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
              {quotation.status === "Approved" && (
                <DropdownMenuItem 
                  className="cursor-pointer"
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
        description="Manage and track all your customer quotations."
        actions={
          <Button className="flex items-center" onClick={() => navigate("/quotations/create")}>
            <FileText className="mr-2 h-4 w-4" />
            Create Quotation
          </Button>
        }
      />
      
      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={quotations} 
          searchKey="customer" 
        />
      </div>

      <FloatingActionButton onClick={() => navigate("/quotations/create")} />
    </div>
  );
}
