
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
import { Download, FileText, CheckCircle, X, Pen, Share2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';
import { generateQuotationPDF } from '@/utils/htmlToPdf';
import { shareQuotation } from '@/utils/mobileShare';

export default function ViewQuotation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const sigCanvasRef = useRef<SignatureCanvas>(null);

  // Set viewport to be unresponsive and zoomable
  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=1024, initial-scale=0.5, user-scalable=yes');
    } else {
      const newViewport = document.createElement('meta');
      newViewport.name = 'viewport';
      newViewport.content = 'width=1024, initial-scale=0.5, user-scalable=yes';
      document.head.appendChild(newViewport);
    }

    // Cleanup on unmount
    return () => {
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }
    };
  }, []);

  const { data: quotation, isLoading, refetch } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationService.getById(id!),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: customer } = useQuery({
    queryKey: ['customer', quotation?.customer_id],
    queryFn: () => customerService.getById(quotation!.customer_id),
    enabled: !!quotation?.customer_id,
    staleTime: 0,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['quotation-items', id],
    queryFn: () => quotationService.getItemsByQuotationId(id!),
    enabled: !!id,
    staleTime: 0,
  });

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

  const handleShare = async () => {
    if (!quotation || !customer) {
      toast.error('Missing quotation or customer information');
      return;
    }

    try {
      await shareQuotation(quotation.id, quotation.reference_number, customer.name);
      toast.success('Quotation shared successfully!');
    } catch (error) {
      console.error('Error sharing quotation:', error);
      toast.error('Failed to share quotation');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{ minWidth: '1024px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{ minWidth: '1024px' }}>
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

  // Group items by category
  const groupedItems: { [key: string]: any[] } = {};
  items.forEach(item => {
    const category = item.category || "Other Items";
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });
  
  const categories = Object.keys(groupedItems).sort();

  return (
    <div className="min-h-screen bg-background" style={{ minWidth: '1024px' }} id="quotation-view">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex flex-col items-center space-y-2">
            <h1 className="text-lg font-bold text-blue-800">Quotation #{quotation.reference_number}</h1>
            <div className="flex items-center justify-center space-x-3">
              <Badge variant={isAccepted ? "default" : "secondary"}>
                {quotation.status}
              </Badge>
              {hasSignature && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Signed
                </Badge>
              )}
              <Button variant="outline" onClick={handleDownloadPDF} disabled={isProcessing} className="ml-4 flex items-center gap-1">
                <Download size={16} />
                <span>Download</span>
              </Button>
              <Button variant="outline" onClick={handleShare} className="flex items-center gap-1">
                <Share2 size={16} />
                <span>Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-4 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Compact Header with Company and Quotation Info in Columns */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Company Logo and Details */}
              <div>
                <img 
                  src="https://i.ibb.co/Ltyts5K/reex-empire-logo.png" 
                  alt="Reex Empire Logo" 
                  className="h-16 w-auto mb-3"
                />
                <h2 className="text-sm font-bold text-gray-900 mb-2">Reex Empire Sdn Bhd (1426553-A)</h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>No. 29-1, Jalan 2A/6, Taman Setapak Indah</p>
                  <p>53300 Setapak Kuala Lumpur</p>
                  <p className="font-semibold text-gray-800">www.reexempire.com</p>
                </div>
                  {/* Subject within customer info */}
                  {quotation.subject && (
                    <div className="mt-3 pt-2 border-t">
                      <p className="text-sm text-gray-800 font-medium mb-1">Subject: {quotation.subject}</p>
                    </div>
                  )}
              </div>
              
              {/* Right Column - Quotation Details and Customer */}
              <div>
                <div className="mb-3">
                  <h1 className="text-xl font-bold text-gray-900 mb-1">Quotation #{quotation.reference_number}</h1>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Issue Date:</strong> {formatDate(quotation.issue_date)}</p>
                    <p><strong>Expiry Date:</strong> {formatDate(quotation.expiry_date)}</p>
                  </div>
                </div>
                
                {customer && (
                  <div className="w-64 bg-gray-100 p-3 rounded-lg text-sm">
                    <p className="text-lg font-bold text-gray-500 font-medium mb-1">Bill To</p>
                    <div className="text-sm text-gray-800 space-y-1">
                      <p>Attn: {customer.name}</p>
                      <p className="font-semibold">{customer.unit_number}</p>
                      <p>{customer.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compact Items Table */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2 font-semibold text-gray-700">Description</th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-16">Qty</th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-24">Unit Price</th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(category => (
                      <React.Fragment key={category}>
                        <tr className="bg-blue-50 border-t border-b">
                          <td colSpan={4} className="p-2 font-semibold text-blue-800 text-sm">
                            {category}
                          </td>
                        </tr>
                        {groupedItems[category].map((item, index) => (
                          <tr key={`${category}-${index}`} className="border-b hover:bg-gray-50">
                            <td className="p-2 text-gray-800">{item.description}</td>
                            <td className="text-right p-2 text-gray-800">{item.quantity}</td>
                            <td className="text-right p-2 text-gray-800">{item.unit_price.toFixed(2)}</td>
                            <td className="text-right p-2 font-semibold text-gray-800">{item.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Compact Subtotal, Deposit and Total Information */}
              <div className="p-3 bg-gray-50 border-t">
                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal:</span>
                      <span>{formatCurrency(quotation.subtotal)}</span>
                    </div>
                    
                    {quotation.requires_deposit && (
                      <div className="flex justify-between">
                        <span className="font-medium">
                          Deposit ({quotation.deposit_percentage}%):
                        </span>
                        <span>{formatCurrency(quotation.deposit_amount || 0)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-base font-bold border-t pt-1">
                      <span>Total:</span>
                      <span className="text-blue-600">{formatCurrency(quotation.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact Additional Information */}
          <AdditionalInfoCard 
            subject={quotation.subject}
            terms={quotation.terms}
            signatureData={hasSignature ? signatureData : undefined}
          />

          {/* Signature Section */}
          {!isAccepted && (
            <Card className="shadow-sm print:hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base text-gray-800">Acceptance</CardTitle>
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
              <CardContent>
                {!isSigning ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4 text-base">
                      Click the "Accept & Sign" button above to digitally sign this quotation.
                    </p>
                    <Button 
                      onClick={() => setIsSigning(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                    >
                      <Pen className="h-4 w-4 mr-2" />
                      Start Digital Signature
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                      By signing below, you accept the terms and conditions of this quotation.
                    </div>
                    
                    <div className="signature-container">
                      <SignatureCanvas
                        ref={sigCanvasRef}
                        canvasProps={{
                          className: 'signature-canvas',
                        }}
                        backgroundColor="white"
                      />
                      <div className="absolute top-2 left-3 text-xs text-gray-400 pointer-events-none">
                        Sign here
                      </div>
                    </div>
                    
                    <div className="flex justify-between gap-3">
                      <Button 
                        variant="outline" 
                        onClick={handleClearSignature}
                        className="px-4"
                      >
                        Clear
                      </Button>
                      <Button 
                        onClick={handleAcceptQuotation}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700 text-white px-6"
                      >
                        {isProcessing ? 'Processing...' : 'Accept Quotation'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact Info */}
          <div className="text-center text-gray-600 text-sm py-3 bg-gray-50 rounded-lg">
            <p>For all enquiries, please contact Khalil Pasha</p>
            <p>Email: reexsb@gmail.com Tel: 011-1665 6525 / 019-999 1024</p>
          </div>
          
          {/* Compact Footer */}
          <div className="text-center text-gray-500 text-xs py-3">
            <p>&copy; {new Date().getFullYear()} Reex Empire Sdn Bhd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
