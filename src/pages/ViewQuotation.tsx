import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { quotationService, customerService } from "@/services";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import SignatureCanvas from 'react-signature-canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ViewQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const signatureCanvas = useRef<SignatureCanvas | null>(null);

  useEffect(() => {
    const fetchQuotationData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const quotationData = await quotationService.getById(id);
        
        if (quotationData) {
          setQuotation(quotationData);
          
          // Fetch quotation items separately
          const quotationItems = await quotationService.getItemsByQuotationId(id);
          setItems(quotationItems || []);
          
          // Fetch customer data
          const customerData = await customerService.getById(quotationData.customer_id);
          setCustomer(customerData);
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

  const handleAcceptQuotation = async () => {
    if (!signatureCanvas.current?.isEmpty()) {
      const signatureDataURL = signatureCanvas.current?.toDataURL();
      console.log('Signature captured:', signatureDataURL ? 'Yes' : 'No');
      
      try {
        await quotationService.updateStatus(id!, 'Accepted', signatureDataURL);
        toast({
          title: "Success",
          description: "Quotation has been accepted successfully!",
        });
        
        // Refresh the quotation data
        const updatedQuotation = await quotationService.getById(id!);
        setQuotation(updatedQuotation);
        setShowAcceptDialog(false);
      } catch (error) {
        console.error("Error accepting quotation:", error);
        toast({
          title: "Error",
          description: "Failed to accept quotation. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Signature Required",
        description: "Please provide your signature to accept the quotation.",
        variant: "destructive",
      });
    }
  };

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
                  Issued: {format(new Date(quotation.issue_date), "MMM dd, yyyy")}
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
              <div className="grid grid-cols-2 gap-6 mb-4">
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
                  <span className="font-semibold text-gray-700 mr-4">Subject:</span>
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
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatMoney(quotation.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card - only show if there are actual notes */}
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

          {quotation.status === 'Pending' && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Accept Quotation</h3>
                <p className="text-gray-600 mb-4">
                  Please review the quotation details and provide your signature to accept.
                </p>
                <Button onClick={() => setShowAcceptDialog(true)} className="bg-green-600 hover:bg-green-700">
                  Accept Quotation
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="text-center text-gray-500 text-sm mt-8">
            <p>Thank you for your business!</p>
            <p>&copy; {new Date().getFullYear()} Reex Empire Sdn Bhd. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Signature Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Quotation</DialogTitle>
            <DialogDescription>
              Please provide your signature to accept this quotation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
              <SignatureCanvas
                ref={signatureCanvas}
                penColor="black"
                canvasProps={{
                  width: 400,
                  height: 200,
                  className: 'signature-canvas w-full h-full',
                  style: { touchAction: 'none' }
                }}
                backgroundColor="white"
                onBegin={() => {
                  console.log('Signature started');
                  // Prevent scrolling on mobile
                  document.body.style.overflow = 'hidden';
                }}
                onEnd={() => {
                  console.log('Signature ended');
                  // Re-enable scrolling
                  document.body.style.overflow = 'auto';
                }}
              />
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => signatureCanvas.current?.clear()}
              >
                Clear Signature
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcceptQuotation} className="bg-green-600 hover:bg-green-700">
              Accept Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
