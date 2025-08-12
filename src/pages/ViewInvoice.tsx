import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Share2, FileText } from "lucide-react";
import { invoiceService, customerService } from "@/services";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { shareInvoice } from "@/utils/mobileShare";

export default function ViewInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set viewport to allow pinch-to-zoom
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
    const fetchInvoiceData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        console.log("Fetching invoice data for ID:", id);
        
        const [invoiceData, itemsData, imagesData] = await Promise.all([
          invoiceService.getById(id),
          invoiceService.getItemsByInvoiceId(id),
          invoiceService.getInvoiceImages(id)
        ]);
        
        console.log("Invoice data:", invoiceData);
        console.log("Items data:", itemsData);
        console.log("Images data:", imagesData);
        
        if (invoiceData) {
          setInvoice(invoiceData);
          setItems(itemsData || []);
          setImages(imagesData || []);
          
          // Set document title
          document.title = `Invoice #${invoiceData.reference_number} - Reex Empire`;
          
          // Fetch customer data
          if (invoiceData.customer_id) {
            console.log("Fetching customer data for ID:", invoiceData.customer_id);
            const customerData = await customerService.getById(invoiceData.customer_id);
            console.log("Customer data:", customerData);
            setCustomer(customerData);
          }
        } else {
          console.log("No invoice data found");
        }
      } catch (error) {
        console.error("Error fetching invoice data:", error);
        toast({
          title: "Error",
          description: "Failed to load invoice",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
    
    // Set up interval to refresh data every 5 minutes to keep the link active
    const interval = setInterval(fetchInvoiceData, 5 * 60 * 1000);
    
    // Cleanup document title and interval on unmount
    return () => {
      clearInterval(interval);
      document.title = 'Reex Empire';
    };
  }, [id]);

  const formatMoney = (amount) => {
    return `RM ${parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!invoice || !customer) {
      toast({
        title: "Missing Information",
        description: "Invoice or customer information not found.",
        variant: "destructive"
      });
      return;
    }

    try {
      await shareInvoice(invoice.id, invoice.reference_number, customer.name);
      toast({
        title: "Success",
        description: "Invoice shared successfully!"
      });
    } catch (error) {
      console.error("Error sharing invoice:", error);
      toast({
        title: "Error",
        description: "Failed to share invoice",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status) => {
    if (status === "Paid") return "bg-green-100 text-green-800 hover:bg-green-100";
    if (status === "Partially Paid") return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    if (status === "Overdue") return "bg-red-100 text-red-600 hover:bg-red-100";
    return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center" style={{ minWidth: '1024px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice || !customer) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center" style={{ minWidth: '1024px' }}>
        <div className="text-center p-8">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">The requested invoice could not be found. The link may have expired or the invoice may not exist.</p>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  // Check if invoice is overdue
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  const isPastDue = dueDate < today && invoice.payment_status !== "Paid";
  const displayPaymentStatus = isPastDue && invoice.payment_status === "Unpaid" ? "Overdue" : invoice.payment_status;

  // Group items by category with sequential indexing
  const groupedItems = {};
  let categoryIndex = 1;
  
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
          {/* Compact Header with Company and Invoice Info in Columns */}
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
                {invoice.subject && (
                  <div className="mt-3 pt-2 border-t">
                    <p className="text-sm text-gray-800 font-semibold mb-1">Subject: {invoice.subject}</p>
                  </div>
                )}
              </div>
              
              {/* Right Column - Invoice Details and Customer */}
              <div>
                <div className="mb-3">
                  <h1 className="text-xl font-bold text-gray-900">Invoice #{invoice.reference_number}</h1>
                  <Badge className={`mb-1 ${getStatusColor(displayPaymentStatus)}`}>
                    {displayPaymentStatus}
                  </Badge>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Issued:</strong> {format(new Date(invoice.issue_date), "MMM dd, yyyy")}</p>
                    <p><strong>Due:</strong> {format(dueDate, "MMM dd, yyyy")}</p>
                  </div>
                </div>
                
                <div className="w-64 bg-gray-100 p-3 rounded-lg text-sm">
                  <p className="text-lg font-bold text-gray-500 font-medium mb-1">Bill To</p>
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

          {/* Compact Items Table with Sequential Category Indexing */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                  {categories.map((category, categoryIdx) => (
                    <React.Fragment key={category}>
                      <tr className="bg-blue-50 border-t border-b">
                        <td colSpan={4} className="p-2 font-semibold text-blue-800 text-sm">
                          {categoryIdx + 1}- {category}
                        </td>
                      </tr>
                      {groupedItems[category].map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-2 text-gray-800">{item.description}</td>
                          <td className="text-right p-2 text-gray-800">{formatAmount(item.unit_price)}</td>
                          <td className="text-right p-2 text-gray-800">{item.quantity}</td>
                          <td className="text-right p-2 font-semibold text-gray-800">{formatAmount(item.amount)}</td>
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
                    <span>{formatMoney(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax_rate > 0 && (
                    <div className="flex justify-between">
                      <span className="font-medium">Tax ({invoice.tax_rate}%):</span>
                      <span>{formatMoney(invoice.tax_amount)}</span>
                    </div>
                  )}
                  {invoice.is_deposit_invoice && (
                    <div className="flex justify-between">
                      <span className="font-medium">Deposit Amount:</span>
                      <span>{formatMoney(invoice.deposit_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t pt-1">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatMoney(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Work Photos Card */}
          {images.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-base">Work Photos</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {images.map((image, index) => (
                  <div key={image.id} className="relative">
                    <img 
                      src={image.image_url} 
                      alt={`Work photo ${index + 1}`} 
                      className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                      onClick={() => window.open(image.image_url, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Information Card */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-base">Payment Details</h3>
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <div className="space-y-1">
                <p><strong>Company Name:</strong> Reex Empire Sdn Bhd</p>
                <p><strong>Bank Name:</strong> Maybank</p>
                <p><strong>Account No:</strong> 514897120482</p>
                <p className="text-blue-700 font-medium mt-2">*Please include the invoice number on payment reference*</p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <AdditionalInfoCard 
            terms={invoice.terms}
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
