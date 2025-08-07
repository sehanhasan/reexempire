
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { customerService } from "@/services";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatPhone } from "@/utils/formatters";

export default function Customers() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerService.getAll();
        setCustomers(data || []);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast({
          title: "Error",
          description: "Failed to fetch customers. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleEdit = (customerId: string) => {
    navigate(`/customers/edit/${customerId}`);
  };

  const handleDelete = async (customerId: string) => {
    try {
      await customerService.delete(customerId);
      setCustomers(customers.filter(customer => customer.id !== customerId));
      toast({
        title: "Customer Deleted",
        description: "Customer has been deleted successfully.",
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
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Phone",
      accessorKey: "phone",
      cell: ({ row }) => formatPhone(row.getValue("phone")),
    },
    {
      header: "Address",
      accessorKey: "address",
      cell: ({ row }) => {
        const address = row.getValue("address");
        return address ? (
          <div className="max-w-xs truncate" title={address}>
            {address}
          </div>
        ) : "-";
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Customers" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Customers"
        actions={
          <Button onClick={() => navigate("/customers/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Customers ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={customers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage="No customers found. Add your first customer to get started."
          />
        </CardContent>
      </Card>
    </div>
  );
}
