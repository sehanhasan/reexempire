
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, MoreHorizontal, Trash, Plus, User, Mail, Phone, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { customerService } from "@/services";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import "../styles/mobile-card.css";
import { Customer } from "@/types/database";

export default function Customers() {
  const navigate = useNavigate();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch customers from the API
  const {
    data: customers = [],
    refetch
  } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll
  });

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    navigate(`/customers/add?id=${customer.id}`);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowConfirmDelete(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    try {
      await customerService.delete(customerToDelete.id);
      toast({
        title: "Customer Deleted",
        description: `${customerToDelete.name} has been deleted.`,
        variant: "destructive"
      });
      setCustomerToDelete(null);
      setShowConfirmDelete(false);
      refetch();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "There was an error deleting the customer.",
        variant: "destructive"
      });
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
    setCustomerToDelete(null);
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name" as keyof Customer,
      cell: ({ row }: { row: { original: Customer } }) => (
        <div 
          className="flex items-center font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors" 
          onClick={() => handleViewCustomer(row.original)}
        >
          <User className="mr-2 h-4 w-4 text-blue-500" />
          {row.original.name}
        </div>
      )
    },
    {
      header: "Contact",
      accessorKey: "email" as keyof Customer,
      cell: ({ row }: { row: { original: Customer } }) => (
        <div className="space-y-1">
          {row.original.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="mr-1 h-3 w-3" />
              {row.original.email}
            </div>
          )}
          {row.original.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="mr-1 h-3 w-3" />
              {row.original.phone}
            </div>
          )}
        </div>
      )
    },
    {
      header: "Location",
      accessorKey: "city" as keyof Customer,
      cell: ({ row }: { row: { original: Customer } }) => (
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="mr-1 h-3 w-3" />
          {row.original.city ? `${row.original.city}${row.original.state ? `, ${row.original.state}` : ''}` : 'Not specified'}
        </div>
      )
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Customer,
      cell: ({ row }: { row: { original: Customer } }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditCustomer(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600" onClick={() => handleDeleteCustomer(row.original)}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  // Custom render function for mobile view to match the design
  const renderCustomMobileCard = (customer: Customer) => (
    <Card 
      key={customer.id} 
      className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleViewCustomer(customer)}
    >
      <CardContent className="p-0">
        {/* Card Header with primary information */}
        <div className="flex justify-between items-center px-4 py-2 border-b bg-blue-50/30">
          <div className="flex items-center text-blue-700 font-semibold">
            <User className="mr-2 h-4 w-4" />
            {customer.name}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="hover:bg-blue-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleEditCustomer(customer); }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer); }}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Card Content */}
        <div className="px-4 py-3 space-y-2">
          {customer.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="mr-2 h-3 w-3" />
              {customer.email}
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="mr-2 h-3 w-3" />
              {customer.phone}
            </div>
          )}
          {(customer.city || customer.state) && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="mr-2 h-3 w-3" />
              {customer.city ? `${customer.city}${customer.state ? `, ${customer.state}` : ''}` : 'Location not specified'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="page-container">
      <PageHeader 
        title="Customers" 
        description="Manage your customer database and contact information."
        actions={
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            <User className="mr-1 h-3 w-3" />
            {customers.length} Customers
          </Badge>
        }
      />
      
      <div className="mt-2">
        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-0">
            <DataTable 
              columns={columns} 
              data={customers} 
              searchKey="name" 
              renderCustomMobileCard={renderCustomMobileCard}
              emptyMessage="No customers found. Add your first customer to get started."
            />
          </CardContent>
        </Card>
      </div>

      {/* Customer Details Dialog */}
      <Dialog open={showCustomerDetails} onOpenChange={setShowCustomerDetails}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <User className="mr-2 h-5 w-5 text-blue-500" />
              Customer Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="font-medium">Name:</span>
                      <span className="ml-2">{selectedCustomer.name}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="font-medium">Email:</span>
                        <span className="ml-2">{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
                        <span className="font-medium">Phone:</span>
                        <span className="ml-2">{selectedCustomer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {(selectedCustomer.address || selectedCustomer.city || selectedCustomer.state) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Address Information</h4>
                    <div className="space-y-2 text-sm">
                      {selectedCustomer.address && (
                        <div className="flex items-start">
                          <MapPin className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="font-medium">Address:</span>
                          <span className="ml-2">{selectedCustomer.address}</span>
                        </div>
                      )}
                      {selectedCustomer.unit_number && (
                        <div className="flex items-center">
                          <span className="font-medium ml-6">Unit:</span>
                          <span className="ml-2">{selectedCustomer.unit_number}</span>
                        </div>
                      )}
                      {selectedCustomer.city && (
                        <div className="flex items-center">
                          <span className="font-medium ml-6">City:</span>
                          <span className="ml-2">{selectedCustomer.city}</span>
                        </div>
                      )}
                      {selectedCustomer.state && (
                        <div className="flex items-center">
                          <span className="font-medium ml-6">State:</span>
                          <span className="ml-2">{selectedCustomer.state}</span>
                        </div>
                      )}
                      {selectedCustomer.postal_code && (
                        <div className="flex items-center">
                          <span className="font-medium ml-6">Postal Code:</span>
                          <span className="ml-2">{selectedCustomer.postal_code}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedCustomer.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCustomerDetails(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowCustomerDetails(false);
                  handleEditCustomer(selectedCustomer);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Customer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer
              {customerToDelete ? ` "${customerToDelete.name}"` : ''} and all associated records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCustomer} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FloatingActionButton onClick={() => navigate("/customers/add")} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
        <Plus className="h-6 w-6" />
      </FloatingActionButton>
    </div>
  );
}
