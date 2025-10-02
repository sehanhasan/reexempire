import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { quotationService } from '@/services/quotationService';
import { customerService } from '@/services/customerService';
import { X, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';
import reexLogo from '@/assets/reex-empire-logo.png';

export default function SignQuotation() {
  const { id } = useParams<{ id: string }>();
  const [customerName, setCustomerName] = useState('');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (customer) {
      setCustomerName(customer.name);
    }
  }, [customer]);

  // Fix signature canvas to match container size
  useEffect(() => {
    const resizeCanvas = () => {
      if (sigCanvasRef.current && canvasContainerRef.current) {
        const canvas = sigCanvasRef.current.getCanvas();
        const container = canvasContainerRef.current;
        const rect = container.getBoundingClientRect();
        
        // Set canvas size to match container
        canvas.width = rect.width;
        canvas.height = 200;
        
        // Clear and redraw if needed
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);
  const handleClearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };

  const handleAcceptQuotation = async () => {
    if (!sigCanvasRef.current || !quotation) return;

    const signatureDataUrl = sigCanvasRef.current.toDataURL();
    if (!signatureDataUrl || sigCanvasRef.current.isEmpty()) {
      toast.error('Please provide a signature before accepting');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsProcessing(true);
    try {
      await quotationService.update(quotation.id, {
        status: 'Accepted',
        signature_data: signatureDataUrl,
      });
      toast.success('Quotation accepted successfully!');
      
      // Refetch to show the read-only view
      await refetch();

      // Close the window after a brief delay
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (error) {
      console.error('Error accepting quotation:', error);
      toast.error('Failed to accept quotation');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 md:h-32 md:w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm md:text-base">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (!quotation || !customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-2">Quotation Not Found</h2>
            <p className="text-sm md:text-base text-muted-foreground mb-4">
              The quotation you're looking for doesn't exist or may have expired.
            </p>
            <Button onClick={() => window.close()}>Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAccepted = quotation.status === 'Accepted';

  if (isAccepted) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          {/* Header with Logo */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <img src={reexLogo} alt="Reex Empire" className="h-12 md:h-16 w-auto" />
                  <div>
                    <CardTitle className="text-lg md:text-xl text-cyan-600">Reex Empire - Quotation Accepted</CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground">This quotation has been signed and accepted</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => window.close()} className="self-end md:self-auto">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Quotation Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg text-cyan-600">Quotation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="font-medium text-sm">Quotation #:</span>{' '}
                  <span className="font-bold text-sm md:text-base">{quotation.reference_number}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Issue Date:</span> {formatDate(quotation.issue_date)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Expiry Date:</span> {formatDate(quotation.expiry_date)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Status:</span>{' '}
                  <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                </div>
              </div>
              <div className="pt-2 border-t">
                <span className="font-medium text-sm">Total Amount:</span>{' '}
                <span className="text-lg md:text-xl font-bold text-blue-600">
                  {formatCurrency(quotation.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg text-cyan-600">Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {customer.name}
                </div>
                <div>
                  <span className="font-medium">Unit Number:</span> {customer.unit_number}
                </div>
                <div>
                  <span className="font-medium">Address:</span> {customer.address}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {customer.phone}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signature Display */}
          {quotation.signature_data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg text-cyan-600">Customer Signature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <img 
                    src={quotation.signature_data} 
                    alt="Customer Signature" 
                    className="max-w-full h-auto mx-auto"
                    style={{ maxHeight: '200px' }}
                  />
                  <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {customer.name}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {formatDate(quotation.updated_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* <div className="flex justify-center">
            <Button onClick={() => window.close()} className="w-full md:w-auto">
              Close
            </Button>
          </div> */}
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (quotation.status === 'Accepted') return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Header with Logo */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <img src={reexLogo} alt="Reex Empire" className="h-12 md:h-16 w-auto" />
                <div>
                  <CardTitle className="text-lg md:text-xl text-cyan-600">Quotation Acceptance</CardTitle>
                  <p className="text-xs md:text-sm text-muted-foreground">Please review and sign the quotation below</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.close()} className="self-end md:self-auto">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Quotation Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg text-cyan-600">Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="font-medium text-sm">Quotation #:</span>{' '}
                <span className="font-bold text-sm md:text-base">{quotation.reference_number}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Issue Date:</span> {formatDate(quotation.issue_date)}
              </div>
              <div className="text-sm">
                <span className="font-medium">Expiry Date:</span> {formatDate(quotation.expiry_date)}
              </div>
              <div className="text-sm">
                <span className="font-medium">Status:</span>{' '}
                <Badge className={getStatusColor()}>
                  {quotation.status === 'Sent' ? 'Pending Acceptance' : quotation.status}
                </Badge>
              </div>
            </div>
            <div className="pt-2 border-t">
              <span className="font-medium text-sm">Total Amount:</span>{' '}
              <span className="text-lg md:text-xl font-bold text-blue-600">
                {formatCurrency(quotation.total)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg text-cyan-600">Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium">Name:</span> {customer.name}
              </div>
              <div>
                <span className="font-medium">Unit Number:</span> {customer.unit_number}
              </div>
              <div>
                <span className="font-medium">Address:</span> {customer.address}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {customer.phone}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg text-cyan-600">Customer Acceptance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName" className="text-sm">Name *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="signatureDate" className="text-sm">Date *</Label>
                  <Input
                    id="signatureDate"
                    type="date"
                    value={signatureDate}
                    onChange={(e) => setSignatureDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Signature *</Label>
                <div 
                  ref={canvasContainerRef}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white mt-1 touch-none"
                >
                  <SignatureCanvas
                    ref={sigCanvasRef}
                    canvasProps={{
                      className: 'signature-canvas w-full h-[200px]',
                      style: { touchAction: 'none' }
                    }}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearSignature}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Signature
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 md:p-4 rounded-lg">
                <p className="text-xs md:text-sm text-blue-800">
                  By signing, I acknowledge that I have read, understood, and agree to the terms and
                  conditions of this quotation. I accept the proposed work and pricing outlined in the
                  quotation.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
                <Button
                  onClick={handleAcceptQuotation}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 px-6 md:px-8 w-full md:w-auto"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept & Sign Quotation
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => window.close()} className="w-full md:w-auto">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}