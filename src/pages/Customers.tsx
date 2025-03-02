
import { useState, useEffect } from "react";
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
  UserPlus,
  Loader2
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { customerService } from "@/services";
import { Customer } from "@/types/database";

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerService.getAll();
        setCustomers(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast({
          title: "Error",
          description: "Failed to load customers. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

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

  const handleDelete = async (customer: Customer) => {
    try {
      await customerService.delete(customer.id);
      setCustomers(customers.filter(c => c.id !== customer.id));
      toast({
        title: "Customer Deleted",
        description: `${customer.name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const columns = [
    {
      header: "Unit #",
      accessorKey: "unit_number" as keyof Customer,
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
          {customer.phone ? (
            <a 
              href={`https://wa.me/60${customer.phone}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              +60 {customer.phone}
            </a>
          ) : (
            <span className="text-muted-foreground">Not provided</span>
          )}
        </div>
      ),
    },
    {
      header: "Address",
      accessorKey: "address" as keyof Customer,
      cell: (customer: Customer) => (
        <span>{customer.address || 'Not provided'}</span>
      ),
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

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading customers...</span>
      </div>
    );
  }

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
