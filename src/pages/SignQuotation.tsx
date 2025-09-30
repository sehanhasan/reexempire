import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { quotationService } from '@/services/quotationService';
import { customerService } from '@/services/customerService';
import { X, Pen, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';
export default function SignQuotation() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const {
    data: quotation,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationService.getById(id!),
    enabled: !!id
  });
  const {
    data: customer
  } = useQuery({
    queryKey: ['customer', quotation?.customer_id],
    queryFn: () => customerService.getById(quotation!.customer_id),
    enabled: !!quotation?.customer_id
  });
  useEffect(() => {
    if (customer) {
      setCustomerName(customer.name);
    }
  }, [customer]);
  const handleClearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };
  const handleAcceptQuotation = async () => {
    if (!sigCanvasRef.current || !quotation) return;
    const signatureDataUrl = sigCanvasRef.current.toDataURL();
    if (!signatureDataUrl || signatureDataUrl === 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==') {
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
        signature_data: signatureDataUrl
      });
      toast.success('Quotation accepted successfully!');

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
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading quotation...</p>
        </div>
      </div>;
  }
  if (!quotation || !customer) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <h2 className="text-2xl font-semibold mb-2">Quotation Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The quotation you're looking for doesn't exist or may have expired.
            </p>
            <Button onClick={() => window.close()}>Close</Button>
          </CardContent>
        </Card>
      </div>;
  }
  if (quotation.status === 'Accepted') {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Already Accepted</h2>
            <p className="text-muted-foreground mb-4">
              This quotation has already been accepted and signed.
            </p>
            <Button onClick={() => window.close()}>Close</Button>
          </CardContent>
        </Card>
      </div>;
  }
  const getStatusColor = () => {
    if (quotation.status === 'Accepted') return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };
  return <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-cyan-600 text-left">Reex Empire - Quotation Acceptance</CardTitle>
                <p className="text-muted-foreground">Please review and sign the quotation below</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.close()}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Quotation Details */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 text-cyan-600">Quotation Details</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Quotation #:</span> {quotation.reference_number}
                  </div>
                  <div>
                    <span className="font-medium">Issue Date:</span> {formatDate(quotation.issue_date)}
                  </div>
                  <div>
                    <span className="font-medium">Expiry Date:</span> {formatDate(quotation.expiry_date)}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <Badge className={getStatusColor()}>
                      {quotation.status === 'Sent' ? 'Pending Acceptance' : quotation.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Total Amount:</span>{' '}
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(quotation.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-cyan-600">Customer Information</h3>
                <div className="space-y-2">
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-cyan-600 text-lg">Customer Acceptance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Name *</Label>
                  <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter your full name" />
                </div>
                <div>
                  <Label htmlFor="signatureDate">Date *</Label>
                  <Input id="signatureDate" type="date" value={signatureDate} onChange={e => setSignatureDate(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Signature *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                  <SignatureCanvas ref={sigCanvasRef} canvasProps={{
                  width: 500,
                  height: 200,
                  className: 'signature-canvas w-full'
                }} />
                </div>
                <div className="flex justify-end mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleClearSignature}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Signature
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">By signing, I acknowledge that I have read, understood, and agree to the terms and conditions of this quotation. I accept the proposed work and pricing outlined in the quotation.</p>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={handleAcceptQuotation} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 px-8">
                  {isProcessing ? <>Processing...</> : <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept & Sign Quotation
                    </>}
                </Button>
                <Button variant="outline" onClick={() => window.close()}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}