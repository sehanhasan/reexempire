
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customerService } from "@/services";
import { useIsMobile } from "@/hooks/use-mobile";

interface CustomerInfoCardProps {
  customerId: string;
  setCustomer: (id: string) => void;
  documentType: "quotation" | "invoice";
  documentNumber: string;
  setDocumentNumber: (value: string) => void;
  documentDate: string;
  setDocumentDate: (value: string) => void;
  expiryDate: string;
  setExpiryDate: (value: string) => void;
  paymentMethod?: string;
  setPaymentMethod?: (value: string) => void;
  quotationReference?: string;
  subject?: string;
  setSubject?: (value: string) => void;
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
  const isMobile = useIsMobile();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const dateLabel = documentType === "quotation" ? "Quotation Date" : "Invoice Date";
  const expiryLabel = documentType === "quotation" ? "Valid Until" : "Due Date";
  
  useEffect(() => {
    // Fetch customers
    const fetchCustomers = async () => {
      try {
        const data = await customerService.getAll();
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    
    fetchCustomers();
  }, []);
  
  useEffect(() => {
    // Get selected customer details
    if (customerId) {
      const fetchCustomer = async () => {
        try {
          const data = await customerService.getById(customerId);
          setSelectedCustomer(data);
        } catch (error) {
          console.error("Error fetching customer:", error);
        }
      };
      
      fetchCustomer();
    } else {
      setSelectedCustomer(null);
    }
  }, [customerId]);
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-lg text-cyan-600">{documentType === "quotation" ? "Quotation" : "Invoice"} Information</CardTitle>
      </CardHeader>
      <CardContent className="py-3 px-4">
        <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "sm:grid-cols-2 gap-6"}`}>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="customer">Customer</Label>
              <Select value={customerId} onValueChange={setCustomer}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCustomer && (
              <div className="pt-2 text-sm text-gray-600">
                {selectedCustomer.email && <div>{selectedCustomer.email}</div>}
                {selectedCustomer.phone && <div>{selectedCustomer.phone}</div>}
                {selectedCustomer.address && <div>{selectedCustomer.address}</div>}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="documentNumber">{documentType === "quotation" ? "Quotation" : "Invoice"} #</Label>
                <Input
                  id="documentNumber"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="documentDate">{dateLabel}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !documentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {documentDate ? format(new Date(documentDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={documentDate ? new Date(documentDate) : undefined}
                      onSelect={(date) => date && setDocumentDate(date.toISOString().split("T")[0])}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="expiryDate">{expiryLabel}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expiryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiryDate ? format(new Date(expiryDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expiryDate ? new Date(expiryDate) : undefined}
                      onSelect={(date) => date && setExpiryDate(date.toISOString().split("T")[0])}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {documentType === "quotation" && setPaymentMethod ? (
                <div className="space-y-1">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : documentType === "invoice" && quotationReference ? (
                <div className="space-y-1">
                  <Label htmlFor="quotationReference">From Quotation</Label>
                  <Input id="quotationReference" value={quotationReference} readOnly className="bg-muted" />
                </div>
              ) : null}
            </div>
            
            {setSubject && (
              <div className="space-y-1">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject || ""}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={`${documentType === "quotation" ? "Quotation" : "Invoice"} subject or title`}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
