
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Edit,
  Trash,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Users,
  UserPlus
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { customerService } from "@/services";
import { Customer } from "@/types/database";

export default function Customers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAll();
      // Sort by most recent first (created_at in descending order)
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Set up mobile search
  useEffect(() => {
    const mobileSearchEvent = new CustomEvent('setup-mobile-search', {
      detail: {
        searchTerm,
        onSearchChange: setSearchTerm,
        placeholder: "Search customers..."
      }
    });
    window.dispatchEvent(mobileSearchEvent);

    return () => {
      window.dispatchEvent(new CustomEvent('clear-mobile-search'));
    };
  }, [searchTerm]);

  const handleView = (customer: Customer) => {
    // First clear the previous customer to avoid state issues
    setSelectedCustomer(null);
    // Use setTimeout to ensure the state is updated before showing dialog
    setTimeout(() => {
      setSelectedCustomer(customer);
      setShowDetails(true);
    }, 10);
  };

  const handleEdit = (customer: Customer) => {
    navigate(`/customers/add?id=${customer.id}`);
  };

  const handleDelete = async (customer: Customer) => {
    try {
      await customerService.delete(customer.id);
      setCustomers(customers.filter(c => c.id !== customer.id));
      setShowDetails(false);
      setSelectedCustomer(null);
      
      toast({
        title: "Customer Deleted",
        description: `${customer.name} has been deleted successfully.`,
        variant: "destructive",
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
      cell: ({ row }: { row: { original: Customer } }) => (
        <div className="font-medium text-blue-600">{row.original.unit_number || 'N/A'}</div>
      ),
    },
    {
      header: "Name",
      accessorKey: "name" as keyof Customer,
      cell: ({ row }: { row: { original: Customer } }) => (
        <div 
          className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => handleView(row.original)}
        >
          {row.original.name}
        </div>
      ),
    },
    {
      header: "WhatsApp",
      accessorKey: "phone" as keyof Customer,
      cell: ({ row }: { row: { original: Customer } }) => (
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-green-500" />
          {row.original.phone ? (
            <a 
              href={`https://wa.me/${row.original.phone.replace(/^\+/, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 hover:underline transition-colors"
            >
              {row.original.phone}
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
      cell: ({ row }: { row: { original: Customer } }) => (
        <div className="flex items-center">
          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-gray-700">{row.original.address || 'Not provided'}</span>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Loading Customers</h3>
              <p className="text-muted-foreground">Please wait while we fetch your customer data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader 
        title="Customers" 
        description="Manage your customer database and relationships."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <Users className="mr-1 h-3 w-3" />
              {customers.length} Total
            </Badge>
          </div>
        }
      />
      
      <div className="mt-6">
        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-0">
            <DataTable 
              columns={columns} 
              data={customers} 
              searchKey="name" 
              externalSearchTerm={searchTerm}
              onExternalSearchChange={setSearchTerm}
              emptyMessage="No customers found. Add your first customer to get started."
            />
          </CardContent>
        </Card>
      </div>

      {selectedCustomer && (
        <Dialog open={showDetails} onOpenChange={(open) => {
          setShowDetails(open);
          if (!open) setSelectedCustomer(null);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Customer Details
              </DialogTitle>
              <DialogDescription>
                Complete information about this customer.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-700 mb-1">Unit Number</p>
                <p className="text-xl font-bold text-blue-900">{selectedCustomer.unit_number || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Customer Name</p>
                <p className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Contact Information</p>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <Phone className="h-5 w-5 mr-3 text-green-600" />
                    <div className="flex-1">
                      {selectedCustomer.phone ? (
                        <a 
                          href={`https://wa.me/${selectedCustomer.phone.replace(/^\+/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-700 hover:text-green-800 font-medium hover:underline"
                        >
                          {selectedCustomer.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </div>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 mr-3 text-gray-600" />
                      <a 
                        href={`mailto:${selectedCustomer.email}`}
                        className="text-gray-700 hover:text-gray-800 font-medium hover:underline"
                      >
                        {selectedCustomer.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Address</p>
                <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 mr-3 mt-0.5 text-gray-600" />
                  <span className="text-gray-700">
                    {selectedCustomer.address || 'Not provided'}
                    {selectedCustomer.city && `, ${selectedCustomer.city}`}
                    {selectedCustomer.state && `, ${selectedCustomer.state}`}
                    {selectedCustomer.postal_code && ` ${selectedCustomer.postal_code}`}
                  </span>
                </div>
              </div>
              
              {selectedCustomer.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">{selectedCustomer.notes}</p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="sm:justify-end pt-6">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetails(false)}
                  className="order-last sm:order-first"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShowDetails(false);
                    if (selectedCustomer) {
                      navigate("/quotations/create", { state: { customerId: selectedCustomer.id } });
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Create Quotation
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowDetails(false);
                    if (selectedCustomer) handleEdit(selectedCustomer);
                  }}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (selectedCustomer) handleDelete(selectedCustomer);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <FloatingActionButton 
        onClick={() => navigate("/customers/add")}
        className="bg-blue-600 hover:bg-blue-700 shadow-lg"
      >
        <UserPlus className="h-6 w-6" />
      </FloatingActionButton>
    </div>
  );
}
