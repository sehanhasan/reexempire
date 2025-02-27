
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit, 
  FileText, 
  MoreHorizontal, 
  Send,
  Trash,
  Eye
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
  // Mock data - would come from API in real app
  const [quotations] = useState<Quotation[]>([
    { id: "QT-001", customer: "John Smith", service: "Bathroom Renovation", amount: "$4,500.00", date: "Sep 12, 2023", status: "Approved" },
    { id: "QT-002", customer: "Emma Johnson", service: "Kitchen Remodel", amount: "$12,350.00", date: "Sep 10, 2023", status: "Sent" },
    { id: "QT-003", customer: "Michael Brown", service: "Flooring Installation", amount: "$2,800.00", date: "Sep 8, 2023", status: "Draft" },
    { id: "QT-004", customer: "Lisa Davis", service: "Roof Repair", amount: "$1,800.00", date: "Sep 5, 2023", status: "Rejected" },
    { id: "QT-005", customer: "Robert Wilson", service: "Deck Construction", amount: "$5,600.00", date: "Sep 3, 2023", status: "Approved" },
    { id: "QT-006", customer: "Jennifer Garcia", service: "Painting Services", amount: "$1,200.00", date: "Aug 29, 2023", status: "Draft" },
    { id: "QT-007", customer: "David Martinez", service: "Electrical Wiring", amount: "$2,300.00", date: "Aug 25, 2023", status: "Sent" },
  ]);

  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Customer",
      accessorKey: "customer",
    },
    {
      header: "Service",
      accessorKey: "service",
    },
    {
      header: "Amount",
      accessorKey: "amount",
    },
    {
      header: "Date",
      accessorKey: "date",
    },
    {
      header: "Status",
      accessorKey: "status",
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
      accessorKey: "actions",
      cell: (quotation: Quotation) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {quotation.status === "Draft" && (
                <DropdownMenuItem className="cursor-pointer">
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600">
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
          <Button className="flex items-center">
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

      <FloatingActionButton />
    </div>
  );
}
