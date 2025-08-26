import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import { invoiceService, customerService } from "@/services";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { shareInvoice } from "@/utils/mobileShare";
import html2pdf from "html2pdf.js";
import "@/styles/zoom.css"; // ✅ Allow pinch zoom styles

export default function ViewInvoice() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // ✅ Pinch-to-zoom effect for this page only
  useEffect(() => {
    const viewport = document.querySelector("meta[name=viewport]");
    let original = "";
    if (viewport) {
      original = viewport.getAttribute("content") || "";
      viewport.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes");
    }
    return () => {
      if (viewport && original) {
        viewport.setAttribute("content", original);
      }
    };
  }, []);
  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [invoiceData, itemsData, imagesData] = await Promise.all([invoiceService.getById(id), invoiceService.getItemsByInvoiceId(id), invoiceService.getInvoiceImages(id)]);
        if (invoiceData) {
          setInvoice(invoiceData);
          setItems(itemsData || []);
          setImages(imagesData || []);
          document.title = `Invoice #${invoiceData.reference_number} - Reex Empire`;
          if (invoiceData.customer_id) {
            const customerData = await customerService.getById(invoiceData.customer_id);
            setCustomer(customerData);
          }
        }
      } catch (error) {
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
    const interval = setInterval(fetchInvoiceData, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      document.title = "Reex Empire";
    };
  }, [id]);
  const formatMoney = amount => `RM ${parseFloat(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
  const formatAmount = amount => parseFloat(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      setIsDownloading(true);
      const element = document.querySelector(".invoice-content");
      if (!element) {
        toast({
          title: "Error",
          description: "Could not find invoice content to download",
          variant: "destructive"
        });
        return;
      }
      const options = {
        margin: [5, 5, 5, 5],
        filename: `invoice-${invoice.reference_number}.pdf`,
        image: {
          type: "jpeg",
          quality: 0.95
        },
        html2canvas: {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          height: element.scrollHeight,
          width: element.scrollWidth
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: true
        },
        pagebreak: {
          mode: "avoid-all"
        }
      };
      await html2pdf().set(options).from(element).save();
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
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
      toast({
        title: "Error",
        description: "Failed to share invoice",
        variant: "destructive"
      });
    }
  };
  const getStatusColor = status => {
    if (status === "Paid") return "bg-green-100 text-green-800 hover:bg-green-100";
    if (status === "Partially Paid") return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    if (status === "Overdue") return "bg-red-100 text-red-600 hover:bg-red-100";
    return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex justify-center items-center zoom-page" style={{
      minWidth: "1024px"
    }}>
        <p>Loading invoice details...</p>
      </div>;
  }
  if (!invoice || !customer) {
    return <div className="min-h-screen bg-background flex justify-center items-center zoom-page" style={{
      minWidth: "1024px"
    }}>
        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Invoice Not Found</h2>
        <Button onClick={() => navigate("/")}>Return Home</Button>
      </div>;
  }
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  const isPastDue = dueDate < today && invoice.payment_status !== "Paid";
  const displayPaymentStatus = isPastDue && invoice.payment_status === "Unpaid" ? "Overdue" : invoice.payment_status;
  const groupedItems = {};
  items.forEach(item => {
    const category = item.category || "Other Items";
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });
  const categories = Object.keys(groupedItems).sort();
  return <div className="min-h-screen bg-background zoom-page" style={{
    minWidth: '1024px'
  }}>
      <div className="py-4 px-4 invoice-content">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Compact Header with Company and Invoice Info in Columns */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Company Logo and Details */}
              <div>
                <img src="https://i.ibb.co/Ltyts5K/reex-empire-logo.png" alt="Reex Empire Logo" className="h-16 w-auto mb-3" />
                <h2 className="text-sm font-bold text-gray-900 mb-2">Reex Empire Sdn Bhd (1426553-A)</h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>No. 29-1, Jalan 2A/6, Taman Setapak Indah</p>
                  <p>53300 Setapak Kuala Lumpur</p>
                  <p className="text-gray-800">www.reexempire.com</p>
                </div>
                {/* Subject within customer info */}
                {invoice.subject && <div className="mt-3 pt-2 border-t">
                    <p className="text-sm text-gray-800 font-semibold mb-1">Subject: {invoice.subject}</p>
                  </div>}
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
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2 font-semibold text-gray-700">Description</th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-24">Price</th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-16">Qty</th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, categoryIndex) => <React.Fragment key={category}>
                        <tr className="bg-blue-50 border-t border-b">
                          <td colSpan={4} className="p-2 font-semibold text-blue-800 text-sm">
                            {categoryIndex + 1}- {category}
                          </td>
                        </tr>
                        {groupedItems[category].map((item, idx) => <tr key={idx} className="border-b hover:bg-gray-50">
                             <td className="p-2 text-gray-800">{item.description}</td>
                              <td className="text-right p-2 text-gray-800">
                                {formatAmount(item.unit_price)}{item.unit && item.unit.trim() !== '' && item.unit.trim().toLowerCase() !== 'unit' ? ` ${item.unit}` : ''}
                              </td>
                             <td className="text-right p-2 text-gray-800">{item.quantity}</td>
                             <td className="text-right p-2 font-semibold text-gray-800">{formatAmount(item.amount)}</td>
                           </tr>)}
                      </React.Fragment>)}
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
                    {invoice.tax_rate > 0 && <div className="flex justify-between">
                        <span className="font-medium">Tax ({invoice.tax_rate}%):</span>
                        <span>{formatMoney(invoice.tax_amount)}</span>
                      </div>}
                    {invoice.is_deposit_invoice && <div className="flex justify-between">
                        <span className="font-medium">Deposit Amount:</span>
                        <span>{formatMoney(invoice.deposit_amount)}</span>
                      </div>}
                    {invoice.quotation_ref_number && !invoice.is_deposit_invoice && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Amount Paid:</span>
                        <span>{formatMoney(invoice.deposit_amount || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t pt-1">
                      <span>Total:</span>
                      <span className="text-blue-600">{formatMoney(invoice.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Photos Card */}
          {images.length > 0 && <Card className="shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-700 mb-3 text-base">Work Photos</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {images.map((image, index) => <div key={image.id} className="relative">
                      <img src={image.image_url} alt={`Work photo ${index + 1}`} className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity shadow-sm" onClick={() => window.open(image.image_url, '_blank')} />
                    </div>)}
                </div>
              </CardContent>
            </Card>}

          {/* Two-Column Bottom Section */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Payment Information Card */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 text-base">Payment Details</h3>
                  <div className="bg-blue-50 p-3 rounded-lg text-sm">
                    <div className="space-y-1">
                      <p><strong>Company Name:</strong> Reex Empire Sdn Bhd</p>
                      <p><strong>Bank Name:</strong> Maybank</p>
                      <p><strong>Account No:</strong> 514897120482</p>
                      <p className="text-blue-700 font-medium mt-2">*Please include the invoice number on payment reference*</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Terms & Conditions */}
                {invoice.terms && <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Terms & Conditions</h4>
                      <p className="text-sm whitespace-pre-wrap">{invoice.terms}</p>
                    </CardContent>
                  </Card>}
              {/* Contact Info */}
              <div className="text-center text-gray-600 text-sm py-3 bg-gray-50 rounded-lg">
                <p>For all enquiries, please contact Khalil Pasha</p>
                <p>Email: reexsb@gmail.com Tel: 011-1665 6525 / 019-999 1024</p>
                <div className="text-center text-gray-500 text-xs py-3">
                  <p>&copy; {new Date().getFullYear()} Reex Empire Sdn Bhd. All rights reserved.</p>
                </div>
              </div>
              
            </div>
          </div>

          {/* Print Button Only */}
          <div className="text-center flex gap-4 justify-center print:hidden">
            <Button onClick={() => {
              // Add print margins to body before printing
              document.body.style.margin = '0.2in 0.2in';
              window.print();
              // Reset margins after printing
              setTimeout(() => {
                document.body.style.margin = '';
              }, 100);
            }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
              Save as PDF
            </Button>
          </div>
        </div>
      </div>
    </div>;
}