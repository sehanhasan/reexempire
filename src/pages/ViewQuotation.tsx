import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Mail, Phone } from "lucide-react";
import { quotationService, customerService } from "@/services";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import SignatureCanvas from 'react-signature-canvas';

interface QuotationItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  category: string;
}

interface Quotation {
  id: string;
  reference_number: string;
  issue_date: string;
  expiry_date: string;
  customer_id: string;
  status: string;
  subtotal: number;
  requires_deposit: boolean;
  deposit_amount: number;
  total: number;
  notes: string;
  terms: string;
  subject: string;
}

export default function ViewQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [signatureDataURL, setSignatureDataURL] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotationData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const quotationData = await quotationService.getById(id);
        
        if (quotationData) {
          setQuotation(quotationData);
          
          // Fetch customer data
          const customerData = await customerService.getById(quotationData.customer_id);
          setCustomer(customerData);

          // Fetch quotation items
          const itemsData = await quotationService.getItemsByQuotationId(id);
          setItems(itemsData || []);
        }
      } catch (error) {
        console.error("Error fetching quotation:", error);
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

  const getStatusColor = (status) => {
    if (status === "Accepted") return "bg-green-100 text-green-800 hover:bg-green-100";
    if (status === "Rejected") return "bg-red-100 text-red-600 hover:bg-red-100";
    return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  };

  const handleAccept = async () => {
    setIsUpdating(true);
    try {
      await quotationService.updateStatus(id!, "Accepted");
      setQuotation(prev => ({ ...prev!, status: "Accepted" }));
      toast({
        title: "Quotation Accepted",
        description: "The quotation has been successfully accepted.",
      });
    } catch (error) {
      console.error("Error accepting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to update quotation status. Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    setIsUpdating(true);
    try {
      await quotationService.updateStatus(id!, "Rejected");
      setQuotation(prev => ({ ...prev!, status: "Rejected" }));
      toast({
        title: "Quotation Rejected",
        description: "The quotation has been successfully rejected.",
      });
    } catch (error) {
      console.error("Error rejecting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to update quotation status. Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignatureEnd = () => {
    if (signatureRef.current) {
      setHasSignature(!signatureRef.current.isEmpty());
      setSignatureDataURL(signatureRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setHasSignature(false);
      setSignatureDataURL(null);
    }
  };

  const saveSignature = async () => {
    setIsUpdating(true);
    try {
      // Here you would typically send the signatureDataURL to your server
      // to store it against the quotation.
      console.log("Signature saved:", signatureDataURL);
      toast({
        title: "Signature Saved",
        description: "Customer signature has been saved.",
      });
      setShowSignature(false);
    } catch (error) {
      console.error("Error saving signature:", error);
      toast({
        title: "Error",
        description: "Failed to save signature. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotation details...</p>
        </div>
      </div>
    );
  }

  if (!quotation || !customer) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quotation Not Found</h2>
          <p className="text-gray-600 mb-6">The requested quotation could not be found or has expired.</p>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  // Group items by category
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
    <div className="min-h-screen bg-gray-50" style={{ minWidth: '1024px' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="https://i.ibb.co/Ltyts5K/reex-empire-logo.png" 
                alt="Reex Empire Logo" 
                className="h-10 w-auto"
              />
            </div>
            <div className="text-center flex-1 px-4">
              <h1 className="text-lg font-bold text-blue-800">Quotation #{quotation.reference_number}</h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-sm text-gray-600">
                  Issued: {format(new Date(quotation.issue_date), "MMM dd, yyyy")} | Expires: {format(new Date(quotation.expiry_date), "MMM dd, yyyy")}
                </p>
                <Badge className={getStatusColor(quotation.status)}>
                  {quotation.status}
                </Badge>
              </div>
            </div>
            <div className="flex items-center">
              <Button variant="outline" onClick={handlePrintPDF} className="flex items-center gap-1">
                <Download size={18} />
                <span>Download PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Company Info Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">From</h3>
                  <div className="text-gray-700">
                    <p className="font-medium">Reex Empire Sdn Bhd (1426553-A)</p>
                    <p>No. 29-1, Jalan 2A/6</p>
                    <p>Taman Setapak Indah</p>
                    <p>53300 Setapak Kuala Lumpur</p>
                    <p>www.reexempire.com</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">To</h3>
                  <div className="text-gray-700">
                    <p className="font-medium">{customer.name}</p>
                    {customer.unit_number && <p>Unit {customer.unit_number}</p>}
                    {customer.address && <p>{customer.address}</p>}
                    {customer.city && <p>{customer.city}, {customer.state} {customer.postal_code}</p>}
                    {customer.phone && <p>Phone: {customer.phone}</p>}
                    {customer.email && <p>Email: {customer.email}</p>}
                  </div>
                </div>
              </div>
              
              {quotation.subject && (
                <div className="mt-4 pt-4 border-t">
                  <span className="font-semibold text-gray-700 mr-2">Subject:</span>
                  <span>{quotation.subject}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Items</h3>
              
              {/* Main table header */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="py-2 px-4 border-b">Description</th>
                      <th className="py-2 px-4 border-b text-right">Price</th>
                      <th className="py-2 px-4 border-b text-right">Qty</th>
                      <th className="py-2 px-4 border-b text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(category => (
                      <>
                        <tr key={category}>
                          <td colSpan={4} className="py-2 px-4 font-medium text-blue-800 bg-blue-50">
                            {category}
                          </td>
                        </tr>
                        {groupedItems[category].map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-3 px-4">{item.description}</td>
                            <td className="py-3 px-4 text-right">{formatMoney(item.unit_price)}</td>
                            <td className="py-3 px-4 text-right">{item.quantity}</td>
                            <td className="py-3 px-4 text-right">{formatMoney(item.amount)}</td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-xs">
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatMoney(quotation.subtotal)}</span>
                  </div>
                  {quotation.requires_deposit && (
                    <div className="flex justify-between py-2">
                      <span className="font-medium">Deposit Required:</span>
                      <span>{formatMoney(quotation.deposit_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatMoney(quotation.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Actions Card */}
          {quotation.status === "Sent" && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Customer Actions</h3>
                <div className="flex gap-4">
                  <Button 
                    onClick={handleAccept}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Accept Quotation
                  </Button>
                  <Button 
                    onClick={handleReject}
                    disabled={isUpdating}
                    variant="destructive"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Reject Quotation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signature Canvas */}
          {showSignature && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Customer Signature</h3>
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      width: 500,
                      height: 200,
                      className: 'signature-canvas w-full h-48 border rounded',
                      style: { 
                        touchAction: 'none',
                        width: '100%',
                        height: '200px'
                      }
                    }}
                    backgroundColor="white"
                    penColor="black"
                    onEnd={handleSignatureEnd}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={clearSignature}
                      variant="outline"
                      size="sm"
                    >
                      Clear
                    </Button>
                    <Button 
                      onClick={saveSignature}
                      disabled={!hasSignature || isUpdating}
                      size="sm"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Signature
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Card */}
          {quotation.notes && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
                <p className="whitespace-pre-line">{quotation.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Terms Card */}
          {quotation.terms && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h3>
                <p className="whitespace-pre-line">{quotation.terms}</p>
              </CardContent>
            </Card>
          )}

          <div className="text-center text-gray-500 text-sm mt-8">
            <p>Thank you for your business!</p>
            <p>&copy; {new Date().getFullYear()} Reex Empire Sdn Bhd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
