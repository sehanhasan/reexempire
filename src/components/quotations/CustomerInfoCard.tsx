
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Receipt } from "lucide-react";
import { customerService } from "@/services";
import { Customer } from "@/types/database";
import AddCustomerForm from "@/components/customers/AddCustomerForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { addDays, format } from "date-fns";

interface CustomerInfoCardProps {
  customer: string;
  setCustomer: (value: string) => void;
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
  unitNumber?: string;
  setUnitNumber?: (value: string) => void;
  readOnly?: boolean; // Add readOnly prop
}

export function CustomerInfoCard({
  customer,
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
  setSubject,
  unitNumber,
  setUnitNumber,
  readOnly = false // Add default value
}: CustomerInfoCardProps) {
  const isQuotation = documentType === "quotation";
  const expiryLabel = isQuotation ? "Valid Until" : "Due Date";
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerService.getAll();
        // Sort by most recently added (created_at in descending order)
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setCustomers(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching customers:", error);
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [isAddCustomerOpen]); // Refetch when modal is closed
  
  const handleDateOptionChange = (days: number) => {
    const today = new Date();
    const futureDate = addDays(today, days);
    setExpiryDate(format(futureDate, 'yyyy-MM-dd'));
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base lg:text-lg">Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 py-3 px-4">
        <div className={`grid grid-cols-1 ${isMobile ? "" : "md:grid-cols-2"} gap-3`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="customer" className="text-sm">Customer</Label>
              {!readOnly && (
                <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Plus className="mr-1 h-3 w-3" />
                      Add Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                    </DialogHeader>
                    <AddCustomerForm 
                      onSuccess={() => setIsAddCustomerOpen(false)} 
                      isModal={true}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <Select 
              value={customer} 
              onValueChange={setCustomer}
              disabled={isLoading || readOnly}
              required
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{c.unit_number || 'No Unit'}</span>
                      <span className="text-xs text-muted-foreground">{c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="documentNumber" className="text-sm">
              {isQuotation ? "Quotation Number" : "Invoice Number"}
            </Label>
            <Input
              id="documentNumber"
              placeholder={documentNumber}
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              readOnly={readOnly}
              className="h-8 text-sm"
            />
          </div>
        </div>
        
        {/* Subject field only */}
        {setSubject && (
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-sm">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Bathroom Renovation"
              value={subject || ''}
              onChange={(e) => setSubject(e.target.value)}
              readOnly={readOnly}
              className="h-8 text-sm"
            />
          </div>
        )}
        
        <div className={`grid grid-cols-1 ${isMobile ? "" : "md:grid-cols-2"} gap-3`}>
          <div className="space-y-1.5">
            <Label htmlFor="expiryDate" className="text-sm">{expiryLabel}</Label>
            <div className="flex space-x-2">
              {!readOnly && (
                <Select 
                  onValueChange={(value) => handleDateOptionChange(parseInt(value))}
                  defaultValue="30"
                >
                  <SelectTrigger className="w-[110px] h-8 text-sm">
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="15">15 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
                className="flex-1 h-8 text-sm"
                readOnly={readOnly}
              />
            </div>
          </div>
          
          {paymentMethod && setPaymentMethod && (
            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod" className="text-sm">Payment Method</Label>
              <Select 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
                disabled={readOnly}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {quotationReference && (
          <div className="pt-1">
            <div className="flex items-center text-blue-600">
              <Receipt className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs">Created from Quotation: <strong>{quotationReference}</strong></span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
