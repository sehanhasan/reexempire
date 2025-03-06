
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Send, Save, Ban } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdditionalInfoCardProps {
  notes: string;
  setNotes: (notes: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  documentType: "quotation" | "invoice";
  isSubmitting?: boolean;
  saveButtonText?: string;
  onSendWhatsapp?: () => void;
}

export function AdditionalInfoCard({
  notes,
  setNotes,
  onSubmit,
  onCancel,
  documentType,
  isSubmitting = false,
  saveButtonText,
  onSendWhatsapp,
}: AdditionalInfoCardProps) {
  const isMobile = useIsMobile();
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base lg:text-lg">Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="py-3 px-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder={`Add any additional notes to this ${documentType}...`}
            className="resize-none h-24"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className={`pt-2 px-4 pb-4 ${isMobile ? "flex-col" : "justify-end"}`}>
        <div className={`${isMobile ? "w-full flex flex-col gap-2" : "flex gap-2"}`}>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <Ban className="mr-1.5 h-4 w-4" />
            Cancel
          </Button>
          
          {onSendWhatsapp && (
            <Button
              type="button"
              variant="secondary"
              className="h-10"
              onClick={onSendWhatsapp}
              disabled={isSubmitting}
            >
              <Send className="mr-1.5 h-4 w-4" />
              Send to WhatsApp
            </Button>
          )}
          
          <Button 
            type="submit" 
            className="h-10"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" />
                {saveButtonText || `Save ${documentType.charAt(0).toUpperCase() + documentType.slice(1)}`}
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
