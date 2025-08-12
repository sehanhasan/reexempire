import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Share2, FileText } from "lucide-react";
import { quotationService, customerService } from "@/services";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";

export default function ViewQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set viewport to allow pinch-to-zoom on mobile while keeping desktop layout
  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=1024, initial-scale=0.3, minimum-scale=0.1, maximum-scale=3.0, user-scalable=yes');
    } else {
      const newViewport = document.createElement('meta');
      newViewport.name = 'viewport';
      newViewport.content = 'width=1024, initial-scale=0.3, minimum-scale=0.1, maximum-scale=3.0, user-scalable=yes';
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
      const quotationViewUrl = `${window.location.origin}/quotations/view/${id}`;
      const whatsappUrl = quotationService.generateWhatsAppShareUrl(id, quotation.reference_number, customer.name, quotationViewUrl);
      window.open(whatsappUrl, '_blank');
      
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

  const getStatusColor = (status) => {
    if (status === "Accepted") return "bg-green-100 text-green-800 hover:bg-green-100";
    if (status === "Rejected") return "bg-red-100 text-red-600 hover:bg-red-100";
    if (status === "Expired") return "bg-gray-100 text-gray-600 hover:bg-gray-100";
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
  const isExpired = expiryDate < today && quotation.status !== "Accepted";
  const displayStatus = isExpired && quotation.status === "Sent" ? "Expired" : quotation.status;

  // Group items by category with index numbers
  const groupedItems = {};
  const categoryIndexMap = {};
  let categoryIndex = 1;
  
  items.forEach(item => {
    const category = item.category || "Other Items";
    if (!groupedItems[category]) {
      groupedItems[category] = [];
      categoryIndexMap[category] = categoryIndex++;
    }
    groupedItems[category].push(item);
  });
  
  const categories = Object.keys(groupedItems).sort();

  return (
    <div className="min-h-screen bg-background" style={{ minWidth: '1024px' }}>

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
                  <p className="text-gray-800">www.reexempire.com</p>
                </div>
                {/* Subject within customer info */}
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
                  <Badge className={`mb-1 ${getStatusColor(displayStatus)}`}>
                    {displayStatus}
                  </Badge>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Issued:</strong> {format(new Date(quotation.issue_date), "MMM dd, yyyy")}</p>
                    <p><strong>Valid Until:</strong> {format(expiryDate, "MMM dd, yyyy")}</p>
                  </div>
                </div>
                
                <div className="w-64 bg-gray-100 p-3 rounded-lg text-sm">
                  <p className="text-lg font-bold text-gray-500 font-medium mb-1">Quote For</p>
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

          {/* Compact Items Table with Category Index Numbers */}
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
                    {categories.map(category => (
                      <React.Fragment key={category}>
                        <tr className="bg-blue-50 border-t border-b">
                          <td colSpan={4} className="p-2 font-semibold text-blue-800 text-sm">
                            {categoryIndexMap[category]}- {category}
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
              
              {/* Compact Subtotal and Total Information */}
              <div className="p-3 bg-gray-50 border-t">
                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal:</span>
                      <span>{formatMoney(quotation.subtotal)}</span>
                    </div>
                    {quotation.tax_rate > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium">Tax ({quotation.tax_rate}%):</span>
                        <span>{formatMoney(quotation.tax_amount)}</span>
                      </div>
                    )}
                    {quotation.requires_deposit && (
                      <div className="flex justify-between">
                        <span className="font-medium">Deposit Required ({quotation.deposit_percentage}%):</span>
                        <span>{formatMoney(quotation.deposit_amount)}</span>
                      </div>
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

          {/* Additional Information */}
          <AdditionalInfoCard 
            terms={quotation.terms}
          />

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
