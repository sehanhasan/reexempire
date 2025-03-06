
import { useState, useEffect } from "react";
import { CardTitle, Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRound, Search, CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { customerService } from "@/services";
import { Customer } from "@/types/database";

interface CustomerInfoCardProps {
  customerId: string;
  setCustomer: (id: string) => void;
  documentType: "quotation" | "invoice";
  documentNumber: string;
  setDocumentNumber: (number: string) => void;
  documentDate: string;
  setDocumentDate: (date: string) => void;
  expiryDate: string;
  setExpiryDate: (date: string) => void;
  paymentMethod?: string;
  setPaymentMethod?: (method: string) => void;
  quotationReference?: string;
  subject?: string;
  setSubject?: (subject: string) => void;
}

export function CustomerInfoCard({
  customerId,
  setCustomer,
  documentType,
  documentNumber,
  setDocumentNumber,
  documentDate,
  setDocumentDate,
  expiryDate,
  setExpiryDate,
  paymentMethod,
  setPaymentMethod,
  quotationReference,
  subject,
  setSubject
}: CustomerInfoCardProps) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  // Load customers when component mounts
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await customerService.getAll();
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        console.error("Error loading customers:", error);
      }
    };
    
    loadCustomers();
  }, []);

  // Set customer details when customer ID changes
  useEffect(() => {
    if (customerId && customers.length > 0) {
      const found = customers.find((c) => c.id === customerId);
      setSelectedCustomer(found || null);
    }
  }, [customerId, customers]);

  // Handle customer search
  useEffect(() => {
    if (customerSearch.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const search = customerSearch.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.name.toLowerCase().includes(search) ||
            c.email?.toLowerCase().includes(search) ||
            c.phone?.toLowerCase().includes(search) ||
            c.unit_number?.toLowerCase().includes(search)
        )
      );
    }
  }, [customerSearch, customers]);

  // Handle customer selection
  const handleSelectCustomer = (selected: Customer) => {
    setCustomer(selected.id);
    setSelectedCustomer(selected);
    setCustomerDialogOpen(false);
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base lg:text-lg">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="py-3 px-4">
          <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-3"} gap-4`}>
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <div className="flex gap-2">
                <Button
                  id="customer"
                  type="button"
                  variant="outline"
                  onClick={() => setCustomerDialogOpen(true)}
                  className={`w-full h-10 ${selectedCustomer ? "justify-start" : "justify-center"}`}
                >
                  {selectedCustomer ? (
                    <>
                      <UserRound className="mr-2 h-4 w-4 text-gray-500" />
                      <span className="truncate">
                        {selectedCustomer.unit_number ? 
                          `${selectedCustomer.unit_number} - ${selectedCustomer.name}` : 
                          selectedCustomer.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Select Customer
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">
                {documentType === "quotation" ? "Quotation" : "Invoice"} Number
              </Label>
              <Input
                id="documentNumber"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentDate">
                {documentType === "quotation" ? "Quotation" : "Invoice"} Date
              </Label>
              <div className="relative">
                <Input
                  id="documentDate"
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className="h-10"
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {documentType === "quotation" && (
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Select
                  value={expiryDate}
                  onValueChange={setExpiryDate}
                >
                  <SelectTrigger id="validUntil" className="h-10">
                    <SelectValue placeholder="Select validity period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}>
                      7 days
                    </SelectItem>
                    <SelectItem value={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}>
                      14 days
                    </SelectItem>
                    <SelectItem value={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}>
                      30 days
                    </SelectItem>
                    <SelectItem value={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}>
                      60 days
                    </SelectItem>
                    <SelectItem value={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}>
                      90 days
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {documentType === "invoice" && (
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <div className="relative">
                  <Input
                    id="dueDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="h-10"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            )}

            {documentType === "invoice" &&
              paymentMethod !== undefined &&
              setPaymentMethod && (
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger id="paymentMethod" className="h-10">
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

            {quotationReference && (
              <div className="space-y-2">
                <Label htmlFor="quotationReference">Quotation Reference</Label>
                <Input
                  id="quotationReference"
                  value={quotationReference}
                  readOnly
                  className="h-10 bg-gray-50"
                />
              </div>
            )}

            {subject !== undefined && setSubject && (
              <div className={`space-y-2 ${isMobile ? "" : "col-span-2 xl:col-span-3"}`}>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g. Monthly Maintenance Service"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-10"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer selection dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="pl-8 h-10"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[300px] rounded border p-2">
              {filteredCustomers.length > 0 ? (
                <div className="space-y-2">
                  {filteredCustomers.map((c) => (
                    <Button
                      key={c.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-2 px-2"
                      onClick={() => handleSelectCustomer(c)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {c.unit_number || "No Unit #"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {c.name}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No customers found
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
