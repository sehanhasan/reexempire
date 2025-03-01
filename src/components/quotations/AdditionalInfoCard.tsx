
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, Receipt } from "lucide-react";

interface AdditionalInfoCardProps {
  notes: string;
  setNotes: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onCancel: () => void;
  onConvertToInvoice?: () => void;
  documentType: "quotation" | "invoice";
}

export function AdditionalInfoCard({
  notes,
  setNotes,
  onSubmit,
  onCancel,
  onConvertToInvoice,
  documentType
}: AdditionalInfoCardProps) {
  const isQuotation = documentType === "quotation";
  const cardTitle = isQuotation ? "Additional Information" : "Payment Information";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {!isQuotation && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-700 mb-2">Bank Details</h3>
              <p className="text-sm text-blue-800">
                Bank: MayBank<br />
                Account Name: RenovateProX Sdn Bhd<br />
                Account Number: 1234 5678 9012<br />
                Swift Code: MBBEMYKL
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-2 mt-4">
          <Label htmlFor="notes">{isQuotation ? "Notes/Terms" : "Notes"}</Label>
          <Textarea
            id="notes"
            placeholder={`Enter any additional ${isQuotation ? "notes or terms and conditions" : "information"}...`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>
      </CardContent>
      <CardFooter className={`flex ${isQuotation ? "justify-between" : "justify-end"} space-x-4`}>
        {isQuotation && onConvertToInvoice && (
          <Button 
            variant="outline" 
            type="button" 
            onClick={onConvertToInvoice}
            className="text-blue-600"
          >
            <Receipt className="mr-2 h-4 w-4" />
            Convert to Invoice
          </Button>
        )}
        
        <div className="space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" onClick={(e) => onSubmit(e)}>
            <Save className="mr-2 h-4 w-4" />
            Save {isQuotation ? "Quotation" : "Invoice"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
