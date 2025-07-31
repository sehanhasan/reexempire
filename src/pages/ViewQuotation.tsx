import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CustomerInfoCard } from '@/components/quotations/CustomerInfoCard';
import { ItemsTable } from '@/components/quotations/ItemsTable';
import { AdditionalInfoCard } from '@/components/quotations/AdditionalInfoCard';
import { quotationService } from '@/services/quotationService';
import { customerService } from '@/services/customerService';
import { Download, FileText, CheckCircle, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';
import { generateQuotationPDF } from '@/utils/htmlToPdf';

export default function ViewQuotation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  const { data: quotation, isLoading, refetch } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationService.getById(id!),
    enabled: !!id,
  });

  const { data: customer } = useQuery({
    queryKey: ['customer', quotation?.customer_id],
    queryFn: () => customerService.getById(quotation!.customer_id),
    enabled: !!quotation?.customer_id,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['quotation-items', id],
    queryFn: () => quotationService.getItems(id!),
    enabled: !!id,
  });

  // Handle signature clearing
  const handleClearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };

  // Handle signature acceptance
  const handleAcceptQuotation = async () => {
    if (!sigCanvasRef.current || !quotation) return;

    const signatureDataUrl = sigCanvasRef.current.toDataURL();
    if (!signatureDataUrl || signatureDataUrl === 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==') {
      toast.error('Please provide a signature before accepting');
      return;
    }

    setIsProcessing(true);
    try {
      await quotationService.updateStatus(quotation.id, 'Accepted');
      setSignatureData(signatureDataUrl);
      setIsSigning(false);
      toast.success('Quotation accepted successfully!');
      refetch();
    } catch (error) {
      console.error('Error accepting quotation:', error);
      toast.error('Failed to accept quotation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!quotation) return;
    
    try {
      setIsProcessing(true);
      await generateQuotationPDF(quotation, customer, items);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Quotation Not Found</h2>
          <p className="text-muted-foreground">The quotation you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isAccepted = quotation.status === 'Accepted';
  const hasSignature = signatureData || quotation.status === 'Accepted';

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6" id="quotation-view">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Quotation #{quotation.reference_number}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isAccepted ? "default" : "secondary"}>
                {quotation.status}
              </Badge>
              {hasSignature && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Signed
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={handleDownloadPDF}
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              {isProcessing ? 'Generating...' : 'Download PDF'}
            </Button>
            
            {!isAccepted && !isSigning && (
              <Button 
                onClick={() => setIsSigning(true)}
                variant="default"
                className="flex-1 sm:flex-none"
              >
                Accept & Sign
              </Button>
            )}
          </div>
        </div>

        {/* Customer Information */}
        {customer && <CustomerInfoCard customer={customer} />}

        {/* Quotation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-medium">{formatDate(quotation.issue_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiry Date</p>
                <p className="font-medium">{formatDate(quotation.expiry_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="font-medium">{formatCurrency(quotation.subtotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-bold text-lg">{formatCurrency(quotation.total)}</p>
              </div>
            </div>

            {quotation.requires_deposit && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Deposit Required</h4>
                <p className="text-blue-700">
                  Amount: {formatCurrency(quotation.deposit_amount || 0)} 
                  {quotation.deposit_percentage && ` (${quotation.deposit_percentage}%)`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items Table */}
        <ItemsTable items={items} />

        {/* Additional Information */}
        <AdditionalInfoCard 
          subject={quotation.subject}
          notes={quotation.notes}
          terms={quotation.terms}
          signatureData={hasSignature ? signatureData : undefined}
        />

        {/* Signature Section */}
        {isSigning && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Digital Signature</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSigning(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                By signing below, you accept the terms and conditions of this quotation.
              </div>
              
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  canvasProps={{
                    className: 'w-full h-48 touch-none',
                    style: {
                      width: '100%',
                      height: '192px',
                      display: 'block',
                      touchAction: 'none'
                    }
                  }}
                  backgroundColor="white"
                />
                <div className="absolute top-2 left-2 text-xs text-gray-400 pointer-events-none">
                  Sign here
                </div>
              </div>
              
              <div className="flex justify-between gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleClearSignature}
                  type="button"
                >
                  Clear
                </Button>
                <Button 
                  onClick={handleAcceptQuotation}
                  disabled={isProcessing}
                  type="button"
                >
                  {isProcessing ? 'Processing...' : 'Accept Quotation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
