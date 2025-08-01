import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { invoiceService, customerService } from "@/services";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

export default function ViewInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const [invoiceData, itemsData, imagesData] = await Promise.all([
          invoiceService.getById(id),
          invoiceService.getItemsByInvoiceId(id),
          invoiceService.getInvoiceImages(id)
        ]);
        
        if (invoiceData) {
          setInvoice(invoiceData);
          setItems(itemsData || []);
          setImages(imagesData || []);
          
          // Fetch customer data
          const customerData = await customerService.getById(invoiceData.customer_id);
          setCustomer(customerData);
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
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

  const getStatusColor = (status) => {
    if (status === "Paid") return "bg-green-100 text-green-800 hover:bg-green-100";
    if (status === "Partially Paid") return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    if (status === "Overdue") return "bg-red-100 text-red-600 hover:bg-red-100";
    return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice || !customer) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="text-center p-8">
          <img 
            src="/lovable-uploads/5000d120-da72-4502-bb4f-8d42de790fdf.png" 
            alt="Reex Empire Logo" 
            className="h-20 w-auto mx-auto mb-4"
          />
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
    <div className="min-h-screen bg-background" style={{ minWidth: '1024px' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/5000d120-da72-4502-bb4f-8d42de790fdf.png" 
                alt="Reex Empire Logo" 
                className="h-10 w-auto"
              />
            </div>
            <div className="text-center flex-1 px-4">
              <h1 className="text-lg font-bold text-blue-800">Invoice #{invoice.reference_number}</h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-sm text-gray-600">
                  Issued: {format(new Date(invoice.issue_date), "MMM dd, yyyy")} | Due: {format(dueDate, "MMM dd, yyyy")}
                </p>
                <Badge className={getStatusColor(displayPaymentStatus)}>
                  {displayPaymentStatus}
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header with Logo */}
          <div className="text-center bg-white rounded-lg shadow-sm p-8">
            <img 
              src="/lovable-uploads/5000d120-da72-4502-bb4f-8d42de790fdf.png" 
              alt="Reex Empire Logo" 
              className="h-20 w-auto mx-auto mb-6"
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice #{invoice.reference_number}</h1>
            <div className="flex items-center justify-center gap-3 mt-3">
              <Badge className={getStatusColor(displayPaymentStatus) + " text-sm px-3 py-1"}>
                {displayPaymentStatus}
              </Badge>
            </div>
          </div>

          {/* Company Info Card */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 text-lg">From</h3>
                  <div className="text-gray-700 space-y-1">
                    <p className="font-medium">Reex Empire Sdn Bhd (1426553-A)</p>
                    <p>No. 29-1, Jalan 2A/6</p>
                    <p>Taman Setapak Indah</p>
                    <p>53300 Setapak Kuala Lumpur</p>
                    <p>www.reexempire.com</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 text-lg">To</h3>
                  <div className="text-gray-700 space-y-1">
                    <p className="font-medium">{customer.name}</p>
                    {customer.unit_number && <p>Unit {customer.unit_number}</p>}
                    {customer.address && <p>{customer.address}</p>}
                    {customer.city && <p>{customer.city}, {customer.state} {customer.postal_code}</p>}
                    {customer.phone && <p>Phone: {customer.phone}</p>}
                    {customer.email && <p>Email: {customer.email}</p>}
                  </div>
                </div>
              </div>
              
              {invoice.subject && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-semibold text-gray-700 mb-2">Subject</h3>
                  <p className="text-gray-700">{invoice.subject}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-700 mb-4 text-lg">Items</h3>
              
              {/* Items displayed as a clean table without input fields */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-3 px-4 border-b font-semibold text-gray-700 text-left">Description</th>
                      <th className="py-3 px-4 border-b text-right font-semibold text-gray-700">Price</th>
                      <th className="py-3 px-4 border-b text-right font-semibold text-gray-700">Qty</th>
                      <th className="py-3 px-4 border-b text-right font-semibold text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(category => (
                      <React.Fragment key={category}>
                        <tr>
                          <td colSpan={4} className="py-3 px-4 font-semibold text-blue-800 bg-blue-50 border-b">
                            {category}
                          </td>
                        </tr>
                        {groupedItems[category].map((item, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-800">{item.description}</td>
                            <td className="py-3 px-4 text-right text-gray-800">{formatMoney(item.unit_price)}</td>
                            <td className="py-3 px-4 text-right text-gray-800">{item.quantity}</td>
                            <td className="py-3 px-4 text-right font-medium text-gray-800">{formatMoney(item.amount)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-8 flex justify-end">
                <div className="w-full max-w-xs bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between py-2">
                    <span className="font-medium text-gray-700">Subtotal:</span>
                    <span className="text-gray-800">{formatMoney(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax_rate > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="font-medium text-gray-700">Tax ({invoice.tax_rate}%):</span>
                      <span className="text-gray-800">{formatMoney(invoice.tax_amount)}</span>
                    </div>
                  )}
                  {invoice.is_deposit_invoice && (
                    <div className="flex justify-between py-2">
                      <span className="font-medium text-gray-700">Deposit Amount:</span>
                      <span className="text-gray-800">{formatMoney(invoice.deposit_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-lg font-bold border-t border-gray-300 mt-2 pt-2">
                    <span className="text-gray-800">Total:</span>
                    <span className="text-blue-600">{formatMoney(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Photos Card */}
          {images.length > 0 && (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-4 text-lg">Work Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative">
                      <img 
                        src={image.image_url} 
                        alt={`Work photo ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                        onClick={() => window.open(image.image_url, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Card */}
          {invoice.notes && (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-3 text-lg">Notes</h3>
                <div className="whitespace-pre-line text-gray-700 bg-gray-50 p-4 rounded-lg">{invoice.notes}</div>
              </CardContent>
            </Card>
          )}

          {/* Terms Card */}
          {invoice.terms && (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-3 text-lg">Terms & Conditions</h3>
                <div className="whitespace-pre-line text-gray-700 bg-gray-50 p-4 rounded-lg">{invoice.terms}</div>
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
    </div>
  );
}
