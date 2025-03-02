
import { useState } from "react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Receipt, Plus, Check, ChevronsUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Sample customers for demo
const customers = [
  { id: "C001", name: "Alice Johnson", unitNumber: "A-12-10" },
  { id: "C002", name: "Bob Smith", unitNumber: "B-07-15" },
  { id: "C003", name: "Carol Williams", unitNumber: "C-03-22" },
  { id: "C004", name: "David Brown", unitNumber: "A-09-05" },
  { id: "C005", name: "Eva Davis", unitNumber: "B-15-18" },
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
  subject: string;
  setSubject: (value: string) => void;
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
  setSubject
}: CustomerInfoCardProps) {
  const isQuotation = documentType === "quotation";
  const expiryLabel = isQuotation ? "Valid Until" : "Due Date";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="customer">Customer</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/customers/add")}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Customer
              </Button>
            </div>
            
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {customer
                    ? customers.find(c => c.name === customer)?.unitNumber + " • " + customer
                    : "Select a customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0">
                <Command>
                  <CommandInput placeholder="Search customer..." />
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup>
                    {customers.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.id}
                        onSelect={() => {
                          setCustomer(c.name);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            customer === c.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{c.unitNumber}</span>
                          <span className="text-sm text-muted-foreground">{c.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
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

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="e.g. Bathroom Renovation"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
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
