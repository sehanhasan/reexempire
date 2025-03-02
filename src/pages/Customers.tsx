
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
  unitNumber: string;
  phone: string;
  address: string;
  status: "Active" | "Inactive";
}

export default function Customers() {
  const navigate = useNavigate();
  
  // Mock data - would come from API in real app
  const [customers] = useState<Customer[]>([
    { id: "C001", name: "Alice Johnson", email: "alice@example.com", unitNumber: "A-12-10", phone: "123456789", address: "Star Residences ONE", status: "Active" },
    { id: "C002", name: "Bob Smith", email: "bob@example.com", unitNumber: "B-07-15", phone: "234567890", address: "Star Residences TWO", status: "Active" },
    { id: "C003", name: "Carol Williams", email: "carol@example.com", unitNumber: "C-03-22", phone: "345678901", address: "Star Residences THREE", status: "Inactive" },
    { id: "C004", name: "David Brown", email: "david@example.com", unitNumber: "A-09-05", phone: "456789012", address: "Ascott", status: "Active" },
    { id: "C005", name: "Eva Davis", email: "eva@example.com", unitNumber: "B-15-18", phone: "567890123", address: "Star Residences ONE", status: "Active" },
    { id: "C006", name: "Frank Miller", email: "frank@example.com", unitNumber: "C-21-01", phone: "678901234", address: "Star Residences TWO", status: "Inactive" },
    { id: "C007", name: "Grace Wilson", email: "grace@example.com", unitNumber: "A-06-11", phone: "789012345", address: "Star Residences THREE", status: "Active" },
  ]);

  // Action handlers
  const handleView = (customer: Customer) => {
    toast({
      title: "View Customer",
      description: `Viewing details for ${customer.name}`
    });
  };

  const handleEdit = (customer: Customer) => {
    toast({
      title: "Edit Customer",
      description: `Editing details for ${customer.name}`
    });
    navigate(`/customers/add?id=${customer.id}`);
  };

  const handleDelete = (customer: Customer) => {
    toast({
      title: "Delete Customer",
      description: `${customer.name} has been deleted`,
      variant: "destructive"
    });
  };

  const columns = [
    {
      header: "Unit #",
      accessorKey: "unitNumber" as keyof Customer,
    },
    {
      header: "Name",
      accessorKey: "name" as keyof Customer,
    },
    {
      header: "WhatsApp",
      accessorKey: "phone" as keyof Customer,
      cell: (customer: Customer) => (
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          <a 
            href={`https://wa.me/60${customer.phone}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            +60 {customer.phone}
          </a>
        </div>
      ),
    },
    {
      header: "Address",
      accessorKey: "address" as keyof Customer,
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
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleView(customer)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleEdit(customer)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={() => handleDelete(customer)}
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
