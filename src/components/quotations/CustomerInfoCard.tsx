
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, UserPlus } from "lucide-react";
import { customerService } from "@/services";
import { useIsMobile } from "@/hooks/use-mobile";

interface CustomerInfoCardProps {
  customerId: string;
  setCustomerId: (id: string) => void;
}

export function CustomerInfoCard({ customerId, setCustomerId }: CustomerInfoCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await customerService.getAll();
        setCustomers(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching customers:", error);
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, []);
  
  // Get customer details by ID
  useEffect(() => {
    if (customerId) {
      const fetchCustomerDetails = async () => {
        try {
          const customer = await customerService.getById(customerId);
          setSelectedCustomer(customer);
        } catch (error) {
          console.error("Error fetching customer details:", error);
        }
      };
      
      fetchCustomerDetails();
    }
  }, [customerId]);
  
  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.phone?.toLowerCase().includes(search) ||
      customer.unit_number?.toLowerCase().includes(search)
    );
  });
  
  // Handle customer selection
  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerId(customer.id);
    setDialogOpen(false);
  };
  
  // Show Add Customer button
  const renderAddCustomerButton = () => (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => window.open('/customers/add', '_blank')}
    >
      <UserPlus className="mr-2 h-4 w-4" />
      Add New Customer
    </Button>
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className={`py-3 px-4 ${isMobile ? "hidden" : ""}`}>
        <CardTitle className="text-base lg:text-lg">Customer Information</CardTitle>
      </CardHeader>
      <CardContent className={`${isMobile ? "pt-4" : ""} px-4 pb-4`}>
        {selectedCustomer ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">{selectedCustomer.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedCustomer.unit_number && `Unit ${selectedCustomer.unit_number}, `}
                  {selectedCustomer.address}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDialogOpen(true)}
              >
                Change
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p>{selectedCustomer.phone || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="truncate">{selectedCustomer.email || "—"}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-muted-foreground mb-4">No customer selected</p>
            <Button onClick={() => setDialogOpen(true)}>Select Customer</Button>
          </div>
        )}
      </CardContent>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center gap-2 my-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="pl-8 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {renderAddCustomerButton()}
          </div>
          
          {loading ? (
            <div className="h-60 flex items-center justify-center">
              <p className="text-muted-foreground">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center space-y-3">
              <p className="text-muted-foreground">No customers found</p>
              {renderAddCustomerButton()}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} onClick={() => handleSelectCustomer(customer)} className="cursor-pointer hover:bg-muted">
                      <TableCell className="font-medium">
                        {customer.unit_number || "—"}
                      </TableCell>
                      <TableCell>
                        {customer.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {customer.phone || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {customer.email || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCustomer(customer);
                          }}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <DialogFooter className="sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
