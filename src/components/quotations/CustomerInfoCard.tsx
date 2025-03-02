
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

interface CustomerInfoCardProps {
  customer: string;
  setCustomer: (value: string) => void;
  documentType: "quotation" | "invoice";
  documentNumber: string;
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
}

export function CustomerInfoCard({
  customer,
  setCustomer,
  documentType,
  documentNumber,
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
  setUnitNumber
}: CustomerInfoCardProps) {
  const isQuotation = documentType === "quotation";
  const expiryLabel = isQuotation ? "Valid Until" : "Due Date";
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerService.getAll();
        setCustomers(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching customers:", error);
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [isAddCustomerOpen]); // Refetch when modal is closed
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="customer">Customer</Label>
              <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
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
            </div>
            <Select 
              value={customer} 
              onValueChange={setCustomer}
              disabled={isLoading}
              required
            >
              <SelectTrigger>
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
          
          {isQuotation ? (
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Quotation Number</Label>
              <Input
                id="documentNumber"
                placeholder={documentNumber}
                defaultValue={documentNumber}
                disabled
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Invoice Number</Label>
              <Input
                id="documentNumber"
                placeholder={documentNumber}
                defaultValue={documentNumber}
                disabled
              />
            </div>
          )}
        </div>
        
        {/* Subject field only */}
        <div className="grid grid-cols-1 gap-4">
          {setSubject && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Bathroom Renovation"
                value={subject || ''}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}
        </div>
        
        {isQuotation ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">{expiryLabel}</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">{expiryLabel}</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
            
            {paymentMethod && setPaymentMethod && (
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select 
                  value={paymentMethod} 
                  onValueChange={setPaymentMethod}
                >
                  <SelectTrigger>
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
        )}

        {quotationReference && (
          <div className="pt-2">
            <div className="flex items-center text-blue-600">
              <Receipt className="h-4 w-4 mr-2" />
              <span className="text-sm">Created from Quotation: <strong>{quotationReference}</strong></span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
