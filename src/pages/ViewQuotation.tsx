import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Share2, FileText, CheckCircle, XCircle } from "lucide-react";
import { quotationService, customerService } from "@/services";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { shareQuotation } from "@/utils/mobileShare";
import SignatureCanvas from 'react-signature-canvas';

export default function ViewQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signaturePad, setSignaturePad] = useState(null);
  const [showSignature, setShowSignature] = useState(false);

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

  useEffect(() => {
    const fetchQuotationData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        console.log("Fetching quotation data for ID:", id);
        
        const [quotationData, itemsData] = await Promise.all([
          quotationService.getById(id),
          quotationService.getItemsByQuotationId(id)
        ]);
        
        console.log("Quotation data:", quotationData);
        console.log("Items data:", itemsData);
        
        if (quotationData) {
          setQuotation(quotationData);
          setItems(itemsData || []);
          
          // Fetch customer data
          if (quotationData.customer_id) {
            console.log("Fetching customer data for ID:", quotationData.customer_id);
            const customerData = await customerService.getById(quotationData.customer_id);
            console.log("Customer data:", customerData);
            setCustomer(customerData);
          }
        } else {
          console.log("No quotation data found");
        }
      } catch (error) {
        console.error("Error fetching quotation data:", error);
        toast({
          title: "Error",
          description: "Failed to load quotation",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuotationData();
    
    // Set up interval to refresh data every 5 minutes to keep the link active
    const interval = setInterval(fetchQuotationData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [id]);

  const formatMoney = (amount) => {
    return `RM ${parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!quotation || !customer) {
      toast({
        title: "Missing Information",
        description: "Quotation or customer information not found.",
        variant: "destructive"
      });
      return;
    }

    try {
      await shareQuotation(quotation.id, quotation.reference_number, customer.name, customer.phone);
      toast({
        title: "Success",
        description: "Quotation shared successfully!"
      });
    } catch (error) {
      console.error("Error sharing quotation:", error);
      toast({
        title: "Error",
        description: "Failed to share quotation",
        variant: "destructive"
      });
    }
  };

  const handleAccept = async () => {
    if (!showSignature) {
      setShowSignature(true);
      return;
    }

    if (!signaturePad || signaturePad.isEmpty()) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature to accept the quotation.",
        variant: "destructive"
      });
      return;
    }

    try {
      await quotationService.updateStatus(id!, "Accepted");
      
      toast({
        title: "Quotation Accepted",
        description: "Thank you! The quotation has been accepted successfully.",
      });

      setQuotation(prev => prev ? { ...prev, status: "Accepted" } : null);
      setShowSignature(false);
    } catch (error) {
      console.error("Error accepting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to accept quotation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async () => {
    try {
      await quotationService.updateStatus(id!, "Rejected");
      
      toast({
        title: "Quotation Rejected",
        description: "The quotation has been rejected.",
        variant: "destructive"
      });

      setQuotation(prev => prev ? { ...prev, status: "Rejected" } : null);
    } catch (error) {
      console.error("Error rejecting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to reject quotation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status) => {
    if (status === "Accepted") return "bg-green-100 text-green-800 hover:bg-green-100";
    if (status === "Rejected") return "bg-red-100 text-red-600 hover:bg-red-100";
    if (status === "Sent") return "bg-blue-100 text-blue-600 hover:bg-blue-100";
    return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center" style={{ minWidth: '1024px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotation details...</p>
        </div>
      </div>
    );
  }

  if (!quotation || !customer) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center" style={{ minWidth: '1024px' }}>
        <div className="text-center p-8">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quotation Not Found</h2>
          <p className="text-gray-600 mb-6">The requested quotation could not be found. The link may have expired or the quotation may not exist.</p>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  // Check if quotation is expired
  const expiryDate = new Date(quotation.expiry_date);
  const today = new Date();
  const isExpired = expiryDate < today;

  // Group items by category with number sequence
  const groupedItems = {};
  items.forEach(item => {
    const category = item.category || "Other Items";
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });
  
  const categories = Object.keys(groupedItems).sort();

  return (
    <div className="min-h-screen bg-background" style={{ minWidth: '1024px' }}>

      <div className="py-4 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Header Actions */}
          <div className="flex justify-between items-center print:hidden">
            <h1 className="text-2xl font-bold">Quotation #{quotation.reference_number}</h1>
            <div className="flex gap-2">
              <Button onClick={handleShare} size="sm" variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={handlePrintPDF} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

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
                  <p className="text-gray-800">www.reexempire.com</p>
                </div>
                {quotation.subject && (
                  <div className="mt-3 pt-2 border-t">
                    <p className="text-sm text-gray-800 font-semibold mb-1">Subject: {quotation.subject}</p>
                  </div>
                )}
              </div>
              
              {/* Right Column - Quotation Details and Customer */}
              <div>
                <div className="mb-3">
                  <h1 className="text-xl font-bold text-gray-900">Quotation #{quotation.reference_number}</h1>
                  <Badge className={`mb-1 ${getStatusColor(quotation.status)}`}>
                    {quotation.status}
                  </Badge>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Issued:</strong> {format(new Date(quotation.issue_date), "MMM dd, yyyy")}</p>
                    <p><strong>Valid Until:</strong> {format(expiryDate, "MMM dd, yyyy")}</p>
                    {isExpired && quotation.status === "Sent" && (
                      <p className="text-red-600 font-medium">This quotation has expired</p>
                    )}
                  </div>
                </div>
                
                <div className="w-64 bg-gray-100 p-3 rounded-lg text-sm">
                  <p className="text-lg font-bold text-gray-500 font-medium mb-1">Prepared For</p>
                  <div className="text-sm text-gray-800 space-y-1">
                    <p>Attn: {customer.name}</p>
                    {customer.unit_number && <p className="font-semibold">{customer.unit_number}</p>}
                    {customer.address && <p>{customer.address}</p>}
                    {customer.city && <p>{customer.city}, {customer.state} {customer.postal_code}</p>}
                  </div>
                </div>
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
                      <th className="text-right p-2 font-semibold text-gray-700 w-16">Price</th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-16">Qty</th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, categoryIndex) => (
                      <React.Fragment key={category}>
                        <tr className="bg-blue-50 border-t border-b">
                          <td colSpan={4} className="p-2 font-semibold text-blue-800 text-sm">
                            {categoryIndex + 1} - {category}
                          </td>
                        </tr>
                        {groupedItems[category].map((item, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="p-2 text-gray-800">{item.description}</td>
                            <td className="text-right p-2 text-gray-800">{formatMoney(item.unit_price)}</td>
                            <td className="text-right p-2 text-gray-800">{item.quantity}</td>
                            <td className="text-right p-2 font-semibold text-gray-800">{formatMoney(item.amount)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-3 bg-gray-50 border-t">
                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal:</span>
                      <span>{formatMoney(quotation.subtotal)}</span>
                    </div>
                    {quotation.requires_deposit && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-medium">Deposit ({quotation.deposit_percentage}%):</span>
                          <span>{formatMoney(quotation.deposit_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Balance after deposit:</span>
                          <span>{formatMoney(quotation.total - quotation.deposit_amount)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-base font-bold border-t pt-1">
                      <span>Total:</span>
                      <span className="text-blue-600">{formatMoney(quotation.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Action Buttons */}
          {quotation.status === "Sent" && !isExpired && (
            <Card className="shadow-sm print:hidden">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Customer Action Required</h3>
                {!showSignature ? (
                  <div className="flex gap-4">
                    <Button 
                      onClick={handleAccept}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Quotation
                    </Button>
                    <Button 
                      onClick={handleReject}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Quotation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600">Please provide your signature to accept this quotation:</p>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <SignatureCanvas
                        ref={(ref) => setSignaturePad(ref)}
                        canvasProps={{
                          width: 400,
                          height: 150,
                          className: 'signature-canvas bg-white border rounded'
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAccept} className="bg-green-600 hover:bg-green-700">
                        Confirm Acceptance
                      </Button>
                      <Button 
                        onClick={() => signaturePad?.clear()} 
                        variant="outline"
                      >
                        Clear Signature
                      </Button>
                      <Button 
                        onClick={() => setShowSignature(false)} 
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <AdditionalInfoCard 
            terms={quotation.terms}
          />

          <div className="text-center text-gray-600 text-sm py-3 bg-gray-50 rounded-lg">
            <p>For all enquiries, please contact Khalil Pasha</p>
            <p>Email: reexsb@gmail.com Tel: 011-1665 6525 / 019-999 1024</p>
          </div>

          <div className="text-center text-gray-500 text-xs py-3">
            <p>&copy; {new Date().getFullYear()} Reex Empire Sdn Bhd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
