
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { shareQuotation, shareInvoice } from '@/utils/mobileShare';

interface AdditionalInfoFormProps {
  terms?: string;
  setTerms?: (terms: string) => void;
  onSubmit: (e: React.FormEvent, status?: string) => Promise<void>;
  onCancel: () => void;
  documentType: 'quotation' | 'invoice';
  isSubmitting: boolean;
  showDraft?: boolean;
  onSendWhatsapp?: () => void;
  documentId?: string;
  documentNumber?: string;
  customerName?: string;
  isEditMode?: boolean;
}

export function AdditionalInfoForm({
  terms,
  setTerms,
  onSubmit,
  onCancel,
  documentType,
  isSubmitting,
  showDraft = false,
  onSendWhatsapp,
  documentId,
  documentNumber,
  customerName,
  isEditMode = false
}: AdditionalInfoFormProps) {
  const isMobile = useIsMobile();

  const handleSendWithShare = async (e: React.FormEvent) => {
    // First submit the document
    await onSubmit(e, "Sent");
    
    // Then try to share via mobile if we have the required data
    if (documentId && documentNumber && customerName) {
      try {
        if (documentType === 'quotation') {
          await shareQuotation(documentId, documentNumber, customerName);
        } else {
          await shareInvoice(documentId, documentNumber, customerName);
        }
      } catch (error) {
        console.error(`Error sharing ${documentType}:`, error);
      }
    } else if (onSendWhatsapp) {
      // Fallback to the provided WhatsApp handler
      onSendWhatsapp();
    }
  };

  const getSendButtonText = () => {
    if (isEditMode) {
      return documentType === "quotation" ? "Send Updated Quotation" : "Send Updated Invoice";
    }
    return `Send ${documentType === "quotation" ? "Quotation" : "Invoice"}`;
  };

  return <Card className="shadow-sm">
      
      <CardContent className="py-4 px-4 space-y-4">
        {terms !== undefined && setTerms && <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea id="terms" placeholder="Add terms and conditions..." value={terms} onChange={e => setTerms(e.target.value)} rows={4} className="resize-none" />
          </div>}

        <div className={`flex gap-2 pt-4 ${isMobile ? "flex-col" : ""}`}>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className={isMobile ? "w-full" : ""}>
            Cancel
          </Button>
          
          {showDraft && <Button type="button" variant="secondary" onClick={e => onSubmit(e, "Draft")} disabled={isSubmitting} className={isMobile ? "w-full" : ""}>
              {isSubmitting ? "Saving..." : "Save as Draft"}
            </Button>}

          <Button type="button" onClick={handleSendWithShare} disabled={isSubmitting} className={isMobile ? "w-full" : ""}>
            {isSubmitting ? "Processing..." : getSendButtonText()}
          </Button>
        </div>
      </CardContent>
    </Card>;
}
