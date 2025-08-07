
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Download, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { quotationService, customerService } from "@/services";
import { Quotation, Customer, QuotationItem } from "@/types/database";
import { shareQuotation } from "@/utils/mobileShare";
import { generateQuotationPDF } from "@/utils/pdfGenerator";
import { formatCurrency } from "@/utils/formatters";
import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';

export default function ViewQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [signatureData, setSignatureData] = useState<string>("");
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (id) {
      fetchQuotation();
    }
  }, [id]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const quotationData = await quotationService.getById(id!);
      const itemsData = await quotationService.getItemsByQuotationId(id!);
      
      if (quotationData) {
        setQuotation(quotationData);
        setItems(itemsData || []);
        
        // Load existing signature if available
        if (quotationData.signature_data) {
          setSignatureData(quotationData.signature_data);
        }
        
        if (quotationData.customer_id) {
          const customerData = await customerService.getById(quotationData.customer_id);
          setCustomer(customerData);
        }
      }
    } catch (error) {
      console.error("Error fetching quotation:", error);
      toast({
        title: "Error",
        description: "Failed to load quotation details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!quotation || !customer) return;
    
    try {
      await shareQuotation(quotation.id, quotation.reference_number, customer.name);
    } catch (error) {
      console.error("Error sharing quotation:", error);
      toast({
        title: "Error",
        description: "Failed to share quotation",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!quotation || !customer) return;
    
    try {
      await generateQuotationPDF(quotation, customer, items, signatureData);
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleAccept = async () => {
    if (!quotation) return;
    
    try {
      setIsSaving(true);
      await quotationService.updateStatus(quotation.id, "Accepted");
      setQuotation(prev => prev ? { ...prev, status: "Accepted" } : null);
      
      toast({
        title: "Quotation Accepted",
        description: "Thank you for accepting this quotation!",
      });
    } catch (error) {
      console.error("Error accepting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to accept quotation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    if (!quotation) return;
    
    try {
      setIsSaving(true);
      await quotationService.updateStatus(quotation.id, "Rejected");
      setQuotation(prev => prev ? { ...prev, status: "Rejected" } : null);
      
      toast({
        title: "Quotation Rejected",
        description: "The quotation has been rejected.",
      });
    } catch (error) {
      console.error("Error rejecting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to reject quotation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSignature = async () => {
    if (!signatureRef.current || !quotation) return;
    
    try {
      setIsSaving(true);
      const signatureDataUrl = signatureRef.current.toDataURL();
      
      await quotationService.update(quotation.id, {
        signature_data: signatureDataUrl
      });
      
      setSignatureData(signatureDataUrl);
      setShowSignaturePad(false);
      
      toast({
        title: "Signature Saved",
        description: "Your signature has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving signature:", error);
      toast({
        title: "Error",
        description: "Failed to save signature",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Accepted":
        return "default";
      case "Sent":
        return "secondary";
      case "Rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Group items by category with index
  const groupedItems = items.reduce((acc, item, index) => {
    const category = item.category || "Other Items";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, QuotationItem[]>);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading quotation details...</div>
        </div>
      </div>
    );
  }

  if (!quotation || !customer) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Quotation not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/quotations")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quotations
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{quotation.reference_number}</h1>
            <Badge variant={getStatusBadgeVariant(quotation.status)} className="mt-2">
              {quotation.status}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Quotation Details */}
      <div className="space-y-6">
        {/* Customer & Quotation Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill To</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold">{customer.name}</p>
                {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
                {customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
                {customer.address && (
                  <div className="text-sm text-gray-600">
                    <p>{customer.address}</p>
                    {(customer.city || customer.state || customer.postal_code) && (
                      <p>
                        {[customer.city, customer.state, customer.postal_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quotation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quotation Number:</span>
                  <span className="font-semibold">{quotation.reference_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Issue Date:</span>
                  <span>{new Date(quotation.issue_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Expiry Date:</span>
                  <span>{new Date(quotation.expiry_date).toLocaleDateString()}</span>
                </div>
                {quotation.requires_deposit && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Deposit ({quotation.deposit_percentage}%):</span>
                    <span className="font-semibold">{formatCurrency(quotation.deposit_amount || 0)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, categoryItems], categoryIndex) => (
                <div key={category} className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    {categoryIndex + 1}- {category}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Description</th>
                          <th className="text-center py-2">Qty</th>
                          <th className="text-center py-2">Unit</th>
                          <th className="text-right py-2">Unit Price</th>
                          <th className="text-right py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryItems.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-2">{item.description}</td>
                            <td className="text-center py-2">{item.quantity}</td>
                            <td className="text-center py-2">{item.unit}</td>
                            <td className="text-right py-2">{formatCurrency(item.unit_price)}</td>
                            <td className="text-right py-2">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Subtotal:</span>
                <span>{formatCurrency(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(quotation.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Actions */}
        {quotation.status === "Sent" && (
          <Card>
            <CardHeader>
              <CardTitle>Customer Action Required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleAccept}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Quotation
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Quotation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signature Section - Always show if there's a signature or if quotation is accepted */}
        {(signatureData || quotation.status === "Accepted" || quotation.status === "Sent") && (
          <Card>
            <CardHeader>
              <CardTitle>Customer Signature</CardTitle>
            </CardHeader>
            <CardContent>
              {signatureData ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <img 
                      src={signatureData} 
                      alt="Customer Signature" 
                      className="max-w-full h-auto border border-gray-200 rounded bg-white"
                      style={{ maxHeight: '150px' }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Signed digitally on {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  {quotation.status === "Sent" && (
                    <Button 
                      onClick={() => setShowSignaturePad(true)}
                      variant="outline"
                    >
                      Update Signature
                    </Button>
                  )}
                </div>
              ) : (
                quotation.status === "Sent" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Please provide your signature to accept this quotation.
                    </p>
                    <Button onClick={() => setShowSignaturePad(true)}>
                      Add Signature
                    </Button>
                  </div>
                )
              )}

              {/* Signature Pad Modal */}
              {showSignaturePad && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">Add Your Signature</h3>
                    <div className="border border-gray-300 rounded mb-4">
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          width: 400,
                          height: 200,
                          className: 'signature-canvas w-full'
                        }}
                        backgroundColor="white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={clearSignature} variant="outline" className="flex-1">
                        Clear
                      </Button>
                      <Button 
                        onClick={() => setShowSignaturePad(false)} 
                        variant="outline" 
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveSignature} 
                        disabled={isSaving}
                        className="flex-1"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        <AdditionalInfoCard 
          subject={quotation.subject}
          terms={quotation.terms}
          signatureData={signatureData}
        />
      </div>
    </div>
  );
}
