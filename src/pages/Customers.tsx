
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit,
  MoreHorizontal,
  Trash,
  Eye,
  Mail,
  Phone,
  User,
  UserPlus
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: "Active" | "Inactive";
  projects: number;
}

export default function Customers() {
  // Mock data - would come from API in real app
  const [customers] = useState<Customer[]>([
    { id: "C001", name: "Alice Johnson", email: "alice@example.com", phone: "(555) 123-4567", address: "123 Main St, Anytown", status: "Active", projects: 3 },
    { id: "C002", name: "Bob Smith", email: "bob@example.com", phone: "(555) 234-5678", address: "456 Oak Ave, Somewhere", status: "Active", projects: 1 },
    { id: "C003", name: "Carol Williams", email: "carol@example.com", phone: "(555) 345-6789", address: "789 Pine Rd, Nowhere", status: "Inactive", projects: 0 },
    { id: "C004", name: "David Brown", email: "david@example.com", phone: "(555) 456-7890", address: "321 Elm St, Anywhere", status: "Active", projects: 2 },
    { id: "C005", name: "Eva Davis", email: "eva@example.com", phone: "(555) 567-8901", address: "654 Maple Dr, Somewhere", status: "Active", projects: 1 },
    { id: "C006", name: "Frank Miller", email: "frank@example.com", phone: "(555) 678-9012", address: "987 Cedar Ln, Anytown", status: "Inactive", projects: 0 },
    { id: "C007", name: "Grace Wilson", email: "grace@example.com", phone: "(555) 789-0123", address: "147 Birch Rd, Nowhere", status: "Active", projects: 2 },
  ]);

  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (customer: Customer) => (
        <div className="flex items-center">
          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{customer.email}</span>
        </div>
      ),
    },
    {
      header: "Phone",
      accessorKey: "phone",
      cell: (customer: Customer) => (
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{customer.phone}</span>
        </div>
      ),
    },
    {
      header: "Address",
      accessorKey: "address",
    },
    {
      header: "Projects",
      accessorKey: "projects",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (customer: Customer) => {
        return (
          <Badge className={
            customer.status === "Active" ? "bg-green-100 text-green-800 hover:bg-green-200" :
            "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }>
            {customer.status}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (customer: Customer) => {
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
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
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
        title="Customers" 
        description="Manage your customer database."
        actions={
          <Button className="flex items-center">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        }
      />
      
      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={customers} 
          searchKey="name" 
        />
      </div>

      <FloatingActionButton />
    </div>
  );
}
