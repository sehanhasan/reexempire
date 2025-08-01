
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
import { Download, FileText, CheckCircle, X, Pen } from 'lucide-react';
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
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: customer } = useQuery({
    queryKey: ['customer', quotation?.customer_id],
    queryFn: () => customerService.getById(quotation!.customer_id),
    enabled: !!quotation?.customer_id,
    staleTime: 0, // Always fetch fresh data
  });

  const { data: items = [] } = useQuery({
    queryKey: ['quotation-items', id],
    queryFn: () => quotationService.getItemsByQuotationId(id!),
    enabled: !!id,
    staleTime: 0, // Always fetch fresh data
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
          <p className="text-muted-foreground">The quotation you're looking for doesn't exist or may have expired.</p>
          <Button onClick={() => navigate('/')} className="mt-4">Return Home</Button>
        </div>
      </div>
    );
  }

  const isAccepted = quotation.status === 'Accepted';
  const hasSignature = signatureData || quotation.status === 'Accepted';

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6" id="quotation-view">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Company Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/lovable-uploads/5000d120-da72-4502-bb4f-8d42de790fdf.png" 
            alt="Reex Empire Logo" 
            className="h-20 w-auto mb-4"
          />
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">Quotation #{quotation.reference_number}</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
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
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2 w-full sm:w-auto mb-6">
          <Button
            onClick={handleDownloadPDF}
            disabled={isProcessing}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" />
            {isProcessing ? 'Generating...' : 'Download PDF'}
          </Button>
          
          {!isAccepted && (
            <Button 
              onClick={() => setIsSigning(true)}
              variant="default"
              className="flex-1 sm:flex-none"
            >
              <Pen className="h-4 w-4 mr-2" />
              Accept & Sign
            </Button>
          )}
        </div>

        {/* Customer Information */}
        {customer && (
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.phone || 'N/A'}</p>
                </div>
                {customer.unit_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">Unit Number</p>
                    <p className="font-medium">{customer.unit_number}</p>
                  </div>
                )}
                {customer.address && (
                  <div className="col-span-full">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{customer.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Items Table - Display as read-only table */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Description</th>
                    <th className="text-right p-2 font-medium">Quantity</th>
                    <th className="text-right p-2 font-medium">Unit</th>
                    <th className="text-right p-2 font-medium">Unit Price</th>
                    <th className="text-right p-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.description}</td>
                      <td className="text-right p-2">{item.quantity}</td>
                      <td className="text-right p-2">{item.unit}</td>
                      <td className="text-right p-2">{formatCurrency(item.unit_price)}</td>
                      <td className="text-right p-2 font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <AdditionalInfoCard 
          subject={quotation.subject}
          notes={quotation.notes}
          terms={quotation.terms}
          signatureData={hasSignature ? signatureData : undefined}
        />

        {/* Signature Section - Always show if not accepted yet */}
        {!isAccepted && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Digital Signature</CardTitle>
              {isSigning && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSigning(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSigning ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Click the "Accept & Sign" button above to digitally sign this quotation.
                  </p>
                  <Button 
                    onClick={() => setIsSigning(true)}
                    variant="default"
                    size="lg"
                  >
                    <Pen className="h-4 w-4 mr-2" />
                    Start Digital Signature
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">
                    By signing below, you accept the terms and conditions of this quotation.
                  </div>
                  
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden">
                    <SignatureCanvas
                      ref={sigCanvasRef}
                      canvasProps={{
                        className: 'signature-canvas',
                        style: {
                          width: '100%',
                          height: '192px',
                          display: 'block',
                          touchAction: 'none',
                          cursor: 'crosshair'
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
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
