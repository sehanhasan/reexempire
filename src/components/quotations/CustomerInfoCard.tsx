
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
import { Receipt } from "lucide-react";

// Sample customers for demo
const customers = [
  { id: "C001", name: "Alice Johnson" },
  { id: "C002", name: "Bob Smith" },
  { id: "C003", name: "Carol Williams" },
  { id: "C004", name: "David Brown" },
  { id: "C005", name: "Eva Davis" },
];

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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select 
              value={customer} 
              onValueChange={setCustomer}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isQuotation ? (
            <div className="space-y-2">
              <Label htmlFor="documentDate">Quotation Date</Label>
              <Input
                id="documentDate"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                required
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
        
        {/* Add unit number and subject fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {setUnitNumber && (
            <div className="space-y-2">
              <Label htmlFor="unitNumber">Unit #</Label>
              <Input
                id="unitNumber"
                placeholder="e.g., A-12-10"
                value={unitNumber || ''}
                onChange={(e) => setUnitNumber(e.target.value)}
              />
            </div>
          )}
          
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
            
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Quotation Number</Label>
              <Input
                id="documentNumber"
                placeholder={documentNumber}
                defaultValue={documentNumber}
                disabled
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentDate">Invoice Date</Label>
              <Input
                id="documentDate"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                required
              />
            </div>
            
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
