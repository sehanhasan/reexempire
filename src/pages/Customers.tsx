
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { Plus, Search, Edit, Trash2, User, Building2, MapPin, Phone, Mail } from "lucide-react";
import { customerService } from "@/services";
import { Customer } from "@/types/database";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Customers() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.unit_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAll();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCustomerId) return;

    try {
      await customerService.delete(deleteCustomerId);
      toast({
        title: "Customer Deleted",
        description: "The customer has been deleted successfully."
      });
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive"
      });
    } finally {
      setDeleteCustomerId(null);
    }
  };

  const columns = [
    {
      key: "name" as keyof Customer,
      header: "Customer",
      render: (customer: Customer) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {customer.name.includes("Sdn Bhd") || customer.name.includes("Berhad") || customer.name.includes("(M)") ? (
              <Building2 className="h-8 w-8 text-blue-600 bg-blue-100 rounded-full p-1.5" />
            ) : (
              <User className="h-8 w-8 text-green-600 bg-green-100 rounded-full p-1.5" />
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
            {customer.email && (
              <div className="text-sm text-gray-500 flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                {customer.email}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: "unit_number" as keyof Customer,
      header: "Unit",
      render: (customer: Customer) => (
        <div className="flex items-center text-sm text-gray-900">
          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
          {customer.unit_number || "N/A"}
        </div>
      )
    },
    {
      key: "phone" as keyof Customer,
      header: "Contact",
      render: (customer: Customer) => (
        <div className="flex items-center text-sm text-gray-900">
          <Phone className="h-4 w-4 mr-1 text-gray-400" />
          {customer.phone || "N/A"}
        </div>
      )
    }
  ];

  const actions = [
    {
      label: "Edit",
      icon: Edit,
      onClick: (customer: Customer) => navigate(`/customers/add?id=${customer.id}`)
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (customer: Customer) => setDeleteCustomerId(customer.id),
      variant: "destructive" as const
    }
  ];

  if (isMobile) {
    return (
      <div className="page-container pb-20">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No customers found matching your search." : "No customers found. Add your first customer!"}
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white p-4 rounded-lg border mobile-card">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {customer.name.includes("Sdn Bhd") || customer.name.includes("Berhad") || customer.name.includes("(M)") ? (
                        <Building2 className="h-8 w-8 text-blue-600 bg-blue-100 rounded-full p-1.5" />
                      ) : (
                        <User className="h-8 w-8 text-green-600 bg-green-100 rounded-full p-1.5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{customer.name}</h3>
                      {customer.email && (
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          {customer.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {customer.unit_number || "N/A"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {customer.phone || "N/A"}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/customers/add?id=${customer.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={() => setDeleteCustomerId(customer.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <FloatingActionButton
          onClick={() => navigate("/customers/add")}
          icon={Plus}
          label="Add Customer"
        />

        <AlertDialog open={!!deleteCustomerId} onOpenChange={() => setDeleteCustomerId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this customer? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search customers..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCustomers}
        actions={actions}
        loading={loading}
        emptyMessage={searchTerm ? "No customers found matching your search." : "No customers found. Add your first customer!"}
      />

      <AlertDialog open={!!deleteCustomerId} onOpenChange={() => setDeleteCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
