
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Loader2,
  MapPin
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      await customerService.delete(customerToDelete.id);
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
      
      toast({
        title: "Customer Deleted",
        description: `${customerToDelete.name} has been deleted successfully.`,
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
        <div className="font-medium">{row.original.unit_number || 'N/A'}</div>
      ),
    },
    {
      header: "Name",
      accessorKey: "name" as keyof Customer,
      cell: ({ row }: { row: { original: Customer } }) => (
        <div 
          className="font-medium text-blue-600 cursor-pointer"
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
          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
          {row.original.phone ? (
            <a 
              href={`https://wa.me/${row.original.phone.replace(/^\+/, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
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
        <span>{row.original.address || 'Not provided'}</span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Customer,
      cell: ({ row }: { row: { original: Customer } }) => {
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
                onClick={() => handleView(row.original)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleEdit(row.original)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => {
                  navigate("/quotations/create", { state: { customerId: row.original.id } });
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                Create Quotation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={() => handleDelete(row.original)}
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
        // Removed "Add Customer" button from header as requested
      />
      
      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={customers} 
          searchKey="name" 
        />
      </div>

      {selectedCustomer && (
        <Dialog open={showDetails} onOpenChange={(open) => {
          setShowDetails(open);
          if (!open) setSelectedCustomer(null);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>
                Complete information about this customer.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unit Number</p>
                <p className="text-lg font-medium">{selectedCustomer.unit_number || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{selectedCustomer.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
                <div className="flex items-center mt-1">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  {selectedCustomer.phone ? (
                    <a 
                      href={`https://wa.me/${selectedCustomer.phone.replace(/^\+/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedCustomer.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a 
                      href={`mailto:${selectedCustomer.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedCustomer.email}
                    </a>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <div className="flex items-start mt-1">
                  <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                  <span>
                    {selectedCustomer.address || 'Not provided'}
                    {selectedCustomer.city && `, ${selectedCustomer.city}`}
                    {selectedCustomer.state && `, ${selectedCustomer.state}`}
                    {selectedCustomer.postal_code && ` ${selectedCustomer.postal_code}`}
                  </span>
                </div>
              </div>
              
              {selectedCustomer.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
            
            <DialogFooter className="sm:justify-end">
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowDetails(false);
                    if (selectedCustomer) {
                      navigate("/quotations/create", { state: { customerId: selectedCustomer.id } });
                    }
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Create Quotation
                </Button>
                <Button 
                  onClick={() => {
                    setShowDetails(false);
                    if (selectedCustomer) handleEdit(selectedCustomer);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {customerToDelete?.name}'s customer record.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FloatingActionButton onClick={() => navigate("/customers/add")} />
    </div>
  );
}
