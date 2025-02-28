
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  
  // Mock data - would come from API in real app
  const [customers] = useState<Customer[]>([
    { id: "C001", name: "Alice Johnson", email: "alice@example.com", phone: "012-3456789", address: "123 Main St, Subang Jaya, Selangor", status: "Active", projects: 3 },
    { id: "C002", name: "Bob Smith", email: "bob@example.com", phone: "011-23456789", address: "456 Oak Ave, Petaling Jaya, Selangor", status: "Active", projects: 1 },
    { id: "C003", name: "Carol Williams", email: "carol@example.com", phone: "013-3456789", address: "789 Pine Rd, Shah Alam, Selangor", status: "Inactive", projects: 0 },
    { id: "C004", name: "David Brown", email: "david@example.com", phone: "019-4567890", address: "321 Elm St, Kuala Lumpur", status: "Active", projects: 2 },
    { id: "C005", name: "Eva Davis", email: "eva@example.com", phone: "017-5678901", address: "654 Maple Dr, Cheras, Kuala Lumpur", status: "Active", projects: 1 },
    { id: "C006", name: "Frank Miller", email: "frank@example.com", phone: "014-6789012", address: "987 Cedar Ln, Puchong, Selangor", status: "Inactive", projects: 0 },
    { id: "C007", name: "Grace Wilson", email: "grace@example.com", phone: "016-7890123", address: "147 Birch Rd, Georgetown, Penang", status: "Active", projects: 2 },
  ]);

  const columns = [
    {
      header: "ID",
      accessorKey: "id" as keyof Customer,
    },
    {
      header: "Name",
      accessorKey: "name" as keyof Customer,
    },
    {
      header: "Email",
      accessorKey: "email" as keyof Customer,
      cell: (customer: Customer) => (
        <div className="flex items-center">
          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{customer.email}</span>
        </div>
      ),
    },
    {
      header: "Phone",
      accessorKey: "phone" as keyof Customer,
      cell: (customer: Customer) => (
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{customer.phone}</span>
        </div>
      ),
    },
    {
      header: "Address",
      accessorKey: "address" as keyof Customer,
    },
    {
      header: "Projects",
      accessorKey: "projects" as keyof Customer,
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Customer,
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
      accessorKey: "id" as keyof Customer,
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
          <Button className="flex items-center" onClick={() => navigate("/customers/add")}>
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

      <FloatingActionButton onClick={() => navigate("/customers/add")} />
    </div>
  );
}
