
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerSelector } from "@/components/appointments/CustomerSelector";
import { Textarea } from "@/components/ui/textarea";

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
  subject?: string;
  setSubject?: (value: string) => void;
  quotationReference?: string;
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
  subject,
  setSubject,
  quotationReference
}: CustomerInfoCardProps) {
  const [hasSelectedCustomer, setHasSelectedCustomer] = useState(false);
  
  useEffect(() => {
    if (customerId) {
      setHasSelectedCustomer(true);
    }
  }, [customerId]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-lg capitalize">
          {documentType} Details
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 px-4">
        <div className="md:grid md:grid-cols-2 gap-6">
          <div className="space-y-4 mb-6 md:mb-0">
            <div className="space-y-1">
              <Label htmlFor="customer">Customer</Label>
              {hasSelectedCustomer ? (
                <div className="flex items-center">
                  <div className="flex-1">
                    <Input 
                      id="customer" 
                      value={customerId} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="ml-2 whitespace-nowrap"
                    onClick={() => setHasSelectedCustomer(false)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <CustomerSelector 
                  open={!hasSelectedCustomer}
                  onClose={() => setHasSelectedCustomer(false)}
                  onSelectCustomer={(customer) => {
                    setCustomer(customer.id);
                    setHasSelectedCustomer(true);
                  }}
                  selectedCustomerId={customerId}
                />
              )}
            </div>
            
            {documentType === "invoice" && quotationReference && (
              <div className="space-y-1">
                <Label htmlFor="quotationReference">Quotation Reference</Label>
                <Input 
                  id="quotationReference" 
                  value={quotationReference} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
            )}
            
            {setSubject && (
              <div className="space-y-1">
                <Label htmlFor="subject">Subject</Label>
                <Textarea 
                  id="subject" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  rows={3}
                  placeholder={`Enter ${documentType} subject or description...`}
                />
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="documentNumber">{documentType === "quotation" ? "Quotation" : "Invoice"} Number</Label>
              <Input 
                id="documentNumber" 
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="font-medium"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="documentDate">{documentType === "quotation" ? "Issue Date" : "Invoice Date"}</Label>
              <Input 
                id="documentDate" 
                type="date" 
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="expiryDate">{documentType === "quotation" ? "Valid Until" : "Due Date"}</Label>
              <Input 
                id="expiryDate" 
                type="date" 
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
