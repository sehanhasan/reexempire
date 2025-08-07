
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Share2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { shareContent } from "@/utils/mobileShare";

interface ShareDocumentProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: "invoice" | "quotation";
  documentId: string;
  referenceNumber: string;
  customerName: string;
}

export function ShareDocument({
  isOpen,
  onClose,
  documentType,
  documentId,
  referenceNumber,
  customerName
}: ShareDocumentProps) {
  const [customMessage, setCustomMessage] = useState("");

  const getDocumentUrl = () => {
    return `${window.location.origin}/${documentType}s/view/${documentId}`;
  };

  const getDefaultMessage = () => {
    return `${documentType === "invoice" ? "Invoice" : "Quotation"} #${referenceNumber} for ${customerName}\n\nView: ${getDocumentUrl()}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getDocumentUrl());
      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    const message = customMessage || getDefaultMessage();
    
    try {
      await shareContent({
        title: `${documentType === "invoice" ? "Invoice" : "Quotation"} #${referenceNumber}`,
        text: message,
        url: getDocumentUrl()
      });
      
      toast({
        title: "Shared successfully",
        description: `${documentType === "invoice" ? "Invoice" : "Quotation"} has been shared.`
      });
      onClose();
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share. Link copied to clipboard instead."
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Share {documentType === "invoice" ? "Invoice" : "Quotation"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shareUrl">Document Link</Label>
            <div className="flex gap-2">
              <Input
                id="shareUrl"
                value={getDocumentUrl()}
                readOnly
                className="flex-1"
              />
              <Button variant="outline" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customMessage">Custom Message (Optional)</Label>
            <Textarea
              id="customMessage"
              placeholder={getDefaultMessage()}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleShare} className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
