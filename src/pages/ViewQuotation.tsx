
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className="min-h-screen bg-background py-8 px-4" id="quotation-view">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Logo */}
        <div className="text-center bg-white rounded-lg shadow-sm p-8">
          <img 
            src="/lovable-uploads/5000d120-da72-4502-bb4f-8d42de790fdf.png" 
            alt="Reex Empire Logo" 
            className="h-20 w-auto mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotation #{quotation.reference_number}</h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <Badge variant={isAccepted ? "default" : "secondary"} className="text-sm px-3 py-1">
              {quotation.status}
            </Badge>
            {hasSignature && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-sm px-3 py-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Signed
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 print:hidden">
          <Button
            onClick={handleDownloadPDF}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            <Download className="h-4 w-4 mr-2" />
            {isProcessing ? 'Generating...' : 'Download PDF'}
          </Button>
          
          {!isAccepted && (
            <Button 
              onClick={() => setIsSigning(true)}
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            >
              <Pen className="h-4 w-4 mr-2" />
              Accept & Sign
            </Button>
          )}
        </div>

        {/* Customer Information */}
        {customer && (
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Customer</p>
                  <p className="font-semibold text-gray-900">{customer.name}</p>
                  <p className="text-gray-800">{customer.unit_number}</p>
                  <p className="text-gray-800">{customer.address}</p>
                </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quotation Details */}
        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle className="text-lg text-gray-800">Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Issue Date</p>
                <p className="text-gray-800 font-medium">{formatDate(quotation.issue_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Expiry Date</p>
                <p className="text-gray-800 font-medium">{formatDate(quotation.expiry_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Subtotal</p>
                <p className="text-gray-800 font-medium">{formatCurrency(quotation.subtotal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Total</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(quotation.total)}</p>
              </div>
            </div>

            {quotation.requires_deposit && (
              <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Deposit Required</h4>
                <p className="text-blue-800">
                  Amount: {formatCurrency(quotation.deposit_amount || 0)} 
                  {quotation.deposit_percentage && ` (${quotation.deposit_percentage}%)`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items by Category */}
        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle className="text-lg text-gray-800">Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">Description</th>
                    <th className="text-right p-4 font-semibold text-gray-700">Quantity</th>
                    <th className="text-right p-4 font-semibold text-gray-700">Unit</th>
                    <th className="text-right p-4 font-semibold text-gray-700">Unit Price</th>
                    <th className="text-right p-4 font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => (
                    <React.Fragment key={category}>
                      <tr className="bg-blue-50 border-t border-b">
                        <td colSpan={5} className="p-3 font-semibold text-blue-800 text-sm">
                          {category}
                        </td>
                      </tr>
                      {groupedItems[category].map((item, index) => (
                        <tr key={`${category}-${index}`} className="border-b hover:bg-gray-50">
                          <td className="p-4 text-gray-800">{item.description}</td>
                          <td className="text-right p-4 text-gray-800">{item.quantity}</td>
                          <td className="text-right p-4 text-gray-800">{item.unit}</td>
                          <td className="text-right p-4 text-gray-800">{formatCurrency(item.unit_price)}</td>
                          <td className="text-right p-4 font-semibold text-gray-800">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
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

        {/* Signature Section */}
        {!isAccepted && (
          <Card className="shadow-sm print:hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg text-gray-800">Digital Signature</CardTitle>
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
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-6 text-lg">
                    Click the "Accept & Sign" button above to digitally sign this quotation.
                  </p>
                  <Button 
                    onClick={() => setIsSigning(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                  >
                    <Pen className="h-5 w-5 mr-2" />
                    Start Digital Signature
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
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
                      className="px-6"
                    >
                      Clear
                    </Button>
                    <Button 
                      onClick={handleAcceptQuotation}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white px-8"
                    >
                      {isProcessing ? 'Processing...' : 'Accept Quotation'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-6">
          <p>Thank you for your business!</p>
          <p>&copy; {new Date().getFullYear()} Reex Empire Sdn Bhd. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
