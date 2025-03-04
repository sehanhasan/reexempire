
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
  saveButtonText?: string;
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
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base lg:text-lg">Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="py-3 px-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-sm font-medium">
              Notes (Optional)
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Add any additional ${documentType} notes here...`}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <div className={`flex ${isMobile ? "flex-col" : "justify-end"} gap-2 pt-3 border-t`}>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className={`${isMobile ? "w-full order-2 md:order-1" : ""} h-8 text-sm`}
            >
              Cancel
            </Button>
            
            {onConvertToInvoice && (
              <Button
                type="button"
                variant="outline"
                onClick={onConvertToInvoice}
                className={`${isMobile ? "w-full order-1 md:order-2" : ""} h-8 text-sm`}
              >
                Convert to Invoice
              </Button>
            )}
            
            {onSendWhatsapp && (
              <Button
                type="button"
                variant="outline"
                onClick={onSendWhatsapp}
                className={`${isMobile ? "w-full order-2 md:order-3" : ""} h-8 text-sm bg-green-50 hover:bg-green-100 text-green-600 border-green-200`}
              >
                <Send className="mr-1 h-3.5 w-3.5" />
                Send via WhatsApp
              </Button>
            )}
            
            <Button
              type="submit"
              onClick={onSubmit}
              disabled={isSubmitting}
              className={`${isMobile ? "w-full order-3 md:order-4" : ""} h-8 text-sm`}
            >
              {isSubmitting ? (
                "Saving..."
              ) : saveButtonText ? (
                <>
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                  {saveButtonText}
                </>
              ) : (
                <>
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
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
