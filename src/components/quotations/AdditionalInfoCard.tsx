
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Save } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdditionalInfoCardProps {
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (e: React.FormEvent, status?: string) => void;
  onCancel: () => void;
  documentType: "quotation" | "invoice";
  isSubmitting?: boolean;
  saveButtonText?: string;
  onSendWhatsapp?: () => void;
  showDraft?: boolean;
}

export function AdditionalInfoCard({
  notes,
  setNotes,
  onSubmit,
  onCancel,
  documentType,
  isSubmitting = false,
  saveButtonText = "Save",
  onSendWhatsapp,
  showDraft = true
}: AdditionalInfoCardProps) {
  const isMobile = useIsMobile();
  
  const handleSendQuotation = async (e: React.FormEvent) => {
    // First submit the quotation with "Sent" status
    await onSubmit(e, "Sent");
    
    // After successful submission, we would need access to the quotation ID and customer
    // This would typically be handled by the parent component passing the necessary data
    if (onSendWhatsapp) {
      onSendWhatsapp();
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-lg text-cyan-600">Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="py-3 px-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">Notes</label>
            <Textarea 
              id="notes"
              placeholder={`Enter any additional notes for this ${documentType}...`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20"
            />
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col' : 'justify-end'} gap-3 mt-6`}>
            {documentType === "quotation" ? (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  className={`${isMobile ? 'w-full' : ''}`}
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                
                {showDraft && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`${isMobile ? 'w-full' : ''} gap-2`}
                    onClick={(e) => onSubmit(e, "Draft")}
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4" />
                    Save Draft
                  </Button>
                )}
                
                <Button 
                  type="button"
                  className={`${isMobile ? 'w-full' : ''} gap-2 bg-blue-600 hover:bg-blue-700`}
                  onClick={handleSendQuotation}
                  disabled={isSubmitting}
                >
                  <Send className="h-4 w-4" />
                  {saveButtonText === "Save" ? "Send Quotation" : "Send Update"}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  className={`${isMobile ? 'w-full' : ''}`}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                
                <Button 
                  type="submit" 
                  onClick={(e) => onSubmit(e)}
                  className={`${isMobile ? 'w-full' : ''} bg-blue-600 hover:bg-blue-700`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : saveButtonText}
                </Button>
                
                {onSendWhatsapp && (
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={onSendWhatsapp}
                    className={`${isMobile ? 'w-full' : ''} gap-2`}
                    disabled={isSubmitting}
                  >
                    <Send className="h-4 w-4" />
                    Send to WhatsApp
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
