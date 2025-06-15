
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { paymentReceiptService, PaymentReceipt } from '@/services/paymentReceiptService';

interface PaymentReceiptUploadProps {
  invoiceId: string;
  onReceiptUploaded: (receipt: PaymentReceipt) => void;
}

export function PaymentReceiptUpload({ invoiceId, onReceiptUploaded }: PaymentReceiptUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type (images and PDFs)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image (JPEG, PNG, GIF) or PDF file.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a receipt file to upload.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      const receipt = await paymentReceiptService.uploadReceipt(
        invoiceId,
        selectedFile,
        customerNotes
      );

      toast({
        title: "Receipt Uploaded",
        description: "Your payment receipt has been uploaded successfully.",
      });

      onReceiptUploaded(receipt);
      setSelectedFile(null);
      setCustomerNotes('');
      
      // Reset file input
      const fileInput = document.getElementById('receipt-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('receipt-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Payment Receipt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="receipt-upload">Receipt File (Image or PDF)</Label>
          <Input
            id="receipt-upload"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Upload your payment receipt (max 10MB)
          </p>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-sm text-muted-foreground">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeSelectedFile}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div>
          <Label htmlFor="customer-notes">Additional Notes (Optional)</Label>
          <Textarea
            id="customer-notes"
            placeholder="Add any notes about this payment..."
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            disabled={isUploading}
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : 'Upload Receipt'}
        </Button>
      </CardContent>
    </Card>
  );
}
