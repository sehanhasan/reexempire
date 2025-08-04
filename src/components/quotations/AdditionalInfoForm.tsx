
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdditionalInfoFormProps {
  notes: string;
  setNotes: (notes: string) => void;
  terms?: string;
  setTerms?: (terms: string) => void;
  onSubmit: (e: React.FormEvent, status?: string) => Promise<void>;
  onCancel: () => void;
  documentType: 'quotation' | 'invoice';
  isSubmitting: boolean;
  showDraft?: boolean;
  onSendWhatsapp?: () => void;
}

export function AdditionalInfoForm({
  notes,
  setNotes,
  terms,
  setTerms,
  onSubmit,
  onCancel,
  documentType,
  isSubmitting,
  showDraft = false
}: AdditionalInfoFormProps) {
  const isMobile = useIsMobile();

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-lg text-cyan-600">Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="py-4 px-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes or comments..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {terms !== undefined && setTerms && (
          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              placeholder="Add terms and conditions..."
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        )}

        <div className={`flex gap-2 pt-4 ${isMobile ? "flex-col" : ""}`}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className={isMobile ? "w-full" : ""}
          >
            Cancel
          </Button>
          
          {showDraft && (
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => onSubmit(e, "Draft")}
              disabled={isSubmitting}
              className={isMobile ? "w-full" : ""}
            >
              {isSubmitting ? "Saving..." : "Save as Draft"}
            </Button>
          )}

          <Button
            type="button"
            onClick={(e) => onSubmit(e, documentType === "quotation" ? "Sent" : "Sent")}
            disabled={isSubmitting}
            className={isMobile ? "w-full" : ""}
          >
            {isSubmitting ? "Processing..." : `Send ${documentType === "quotation" ? "Quotation" : "Invoice"}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
