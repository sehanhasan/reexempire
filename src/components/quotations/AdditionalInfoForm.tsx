
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

import { useNavigate } from 'react-router-dom';

interface AdditionalInfoFormProps {
  terms?: string;
  setTerms?: (terms: string) => void;
  onSubmit: (e: React.FormEvent, status?: string) => Promise<void>;
  onCancel: () => void;
  documentType: 'quotation' | 'invoice';
  isSubmitting: boolean;
  showDraft?: boolean;
  
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
  
  documentId,
  documentNumber,
  customerName,
  isEditMode = false
}: AdditionalInfoFormProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleSendWithShare = async (e: React.FormEvent) => {
    // First submit the document
    await onSubmit(e, "Sent");
    
    // Then navigate to the view page
    if (documentId) {
      if (documentType === 'quotation') {
        navigate(`/quotations/view/${documentId}`);
      } else {
        navigate(`/invoices/view/${documentId}`);
      }
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
