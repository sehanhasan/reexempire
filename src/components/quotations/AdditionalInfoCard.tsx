
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Send } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdditionalInfoCardProps {
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onConvertToInvoice?: () => void;
  documentType: "quotation" | "invoice";
  isSubmitting?: boolean;
  onSendWhatsapp?: () => void;
  saveButtonText?: string; // Add the missing property
}

export function AdditionalInfoCard({
  notes,
  setNotes,
  onSubmit,
  onCancel,
  onConvertToInvoice,
  documentType,
  isSubmitting = false,
  onSendWhatsapp,
  saveButtonText
}: AdditionalInfoCardProps) {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium leading-6">
              Notes (Optional)
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Add any additional ${documentType} notes here...`}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className={`flex ${isMobile ? "flex-col" : "justify-end"} space-y-2 md:space-y-0 md:space-x-2 pt-4 border-t`}>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className={isMobile ? "w-full order-2 md:order-1" : ""}
            >
              Cancel
            </Button>
            
            {onConvertToInvoice && (
              <Button
                type="button"
                variant="outline"
                onClick={onConvertToInvoice}
                className={isMobile ? "w-full order-1 md:order-2" : ""}
              >
                Convert to Invoice
              </Button>
            )}
            
            {onSendWhatsapp && (
              <Button
                type="button"
                variant="outline"
                onClick={onSendWhatsapp}
                className={isMobile ? "w-full order-2 md:order-3 bg-green-50 hover:bg-green-100 text-green-600 border-green-200" : "bg-green-50 hover:bg-green-100 text-green-600 border-green-200"}
              >
                <Send className="mr-2 h-4 w-4" />
                Send via WhatsApp
              </Button>
            )}
            
            <Button
              type="submit"
              onClick={onSubmit}
              disabled={isSubmitting}
              className={isMobile ? "w-full order-3 md:order-4" : ""}
            >
              {isSubmitting ? (
                "Saving..."
              ) : saveButtonText ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {saveButtonText}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create {documentType.charAt(0).toUpperCase() + documentType.slice(1)}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
