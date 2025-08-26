import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Edit, Trash, Loader2, Mail, Phone, MapPin, User, Search, MoreHorizontal, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { customerService } from "@/services";
import { Customer } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";
export default function Customers() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
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
        variant: "destructive"
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
    setSelectedCustomer(customer);
    setShowDetails(true);
  };
  const handleEdit = (customer: Customer) => {
    navigate(`/customers/add?id=${customer.id}`);
  };
  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };
  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await customerService.delete(customerToDelete.id);
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      setShowDetails(false);
      setSelectedCustomer(null);
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
      toast({
        title: "Customer Deleted",
        description: `${customerToDelete.name} has been deleted successfully.`,
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setCustomerToDelete(null);
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || customer.unit_number && customer.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) || customer.phone && customer.phone.includes(searchTerm) || customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()));
  if (isLoading) {
    return <div className="page-container flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading customers...</span>
      </div>;
  }
  return <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      {!isMobile && (
        <PageHeader title="Customers" actions={
          <Button onClick={() => navigate("/customers/add")} className="bg-blue-600 hover:bg-blue-700">
            <User className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        } />
      )}
      
      {!isMobile && (
        <div className="mb-4">
          <div className="overflow-x-auto">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="pl-10 h-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className={!isMobile ? "bg-white rounded-lg border" : ""}>
        {filteredCustomers.length === 0 ? (
          <div className="py-8 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchTerm ? "No customers found matching your search." : "No customers found."}
            </p>
            {!searchTerm && <p className="text-muted-foreground text-sm mt-2">
                Get started by adding your first customer.
              </p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {isMobile ? (
              <div className="p-2 space-y-3">
                {filteredCustomers.map(customer => (
                  <Card key={customer.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleView(customer)}>
                    <CardContent className="p-0">
                      <div className="p-2 border-b bg-blue-50/30">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-blue-700">
                                {customer.unit_number && <span className="text-blue-700">#{customer.unit_number} - </span>}
                                {customer.name}
                              </h3>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        {customer.phone && <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                            <a href={`https://wa.me/${customer.phone.replace(/^\+/, '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                              {customer.phone}
                            </a>
                          </div>}
                        {customer.email && <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                            <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                              {customer.email}
                            </a>
                          </div>}
                        {customer.address && <div className="flex items-start text-sm">
                            <MapPin className="h-4 w-4 mr-3 mt-1 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {customer.address}
                              {customer.city && `, ${customer.city}`}
                              {customer.state && `, ${customer.state}`}
                              {customer.postal_code && ` ${customer.postal_code}`}
                            </span>
                          </div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit #</TableHead>
                    <TableHead>Phone</TableHead>
                    
                    <TableHead>Address</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map(customer => (
                    <TableRow key={customer.id} className="h-10">
                      <TableCell className="py-1">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="font-medium cursor-pointer text-blue-600" onClick={() => handleView(customer)}>
                            {customer.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{customer.unit_number || "-"}</TableCell>
                      <TableCell>
                        {customer.phone ? (
                          <a href={`https://wa.me/${customer.phone.replace(/^\+/, '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {customer.phone}
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {customer.address ? `${customer.address}${customer.city ? `, ${customer.city}` : ''}${customer.state ? `, ${customer.state}` : ''}` : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(customer)}>
                              <User className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(customer)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/quotations/create", { state: { customerId: customer.id } })}>
                              <Mail className="mr-2 h-4 w-4" />
                              Create Quotation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/customers/history/${customer.id}`)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(customer)}>
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>

      {selectedCustomer && <Dialog open={showDetails} onOpenChange={open => {
      setShowDetails(open);
      if (!open) setSelectedCustomer(null);
    }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>
                Information about this customer.
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
                  {selectedCustomer.phone ? <a href={`https://wa.me/${selectedCustomer.phone.replace(/^\+/, '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {selectedCustomer.phone}
                    </a> : <span className="text-muted-foreground">Not provided</span>}
                </div>
                {selectedCustomer.email && <div className="flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={`mailto:${selectedCustomer.email}`} className="text-blue-600 hover:underline">
                      {selectedCustomer.email}
                    </a>
                  </div>}
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
              
              {selectedCustomer.notes && <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{selectedCustomer.notes}</p>
                </div>}
            </div>
            
            <DialogFooter className="sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => {
              setShowDetails(false);
              if (selectedCustomer) handleEdit(selectedCustomer);
            }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={() => {
              setShowDetails(false);
              if (selectedCustomer) {
                navigate("/quotations/create", {
                  state: {
                    customerId: selectedCustomer.id
                  }
                });
              }
            }} className="bg-blue-600 hover:bg-blue-700">
                  <Mail className="mr-2 h-4 w-4" />
                  Create Quotation
                </Button>
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer "{customerToDelete?.name}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FloatingActionButton onClick={() => navigate("/customers/add")} />
    </div>;
}