
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const [invoiceData, itemsData] = await Promise.all([
          invoiceService.getById(id),
          invoiceService.getItemsByInvoiceId(id)
        ]);
        
        if (invoiceData) {
          setInvoice(invoiceData);
          setItems(itemsData || []);
          
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice || !customer) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">The requested invoice could not be found or has expired.</p>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  // Check if invoice is overdue
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  const isPastDue = dueDate < today && invoice.payment_status !== "Paid";

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
              <h1 className="text-lg font-bold text-blue-800">Invoice #{invoice.reference_number}</h1>
              <p className="text-sm text-gray-600">
                Issued: {format(new Date(invoice.issue_date), "MMM dd, yyyy")} | Due: {format(dueDate, "MMM dd, yyyy")}
              </p>
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
            </CardContent>
          </Card>

          {invoice.subject && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-2">Subject</h3>
                <p>{invoice.subject}</p>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Items</h3>
              
              {categories.map(category => (
                <div key={category} className="mb-6">
                  <h4 className="font-medium text-blue-800 mb-2">{category}</h4>
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
                        {groupedItems[category].map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-3 px-4">{item.description}</td>
                            <td className="py-3 px-4 text-right">{formatMoney(item.unit_price)}</td>
                            <td className="py-3 px-4 text-right">{item.quantity} {item.unit}</td>
                            <td className="py-3 px-4 text-right">{formatMoney(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              
              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-xs">
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatMoney(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax_rate > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="font-medium">Tax ({invoice.tax_rate}%):</span>
                      <span>{formatMoney(invoice.tax_amount)}</span>
                    </div>
                  )}
                  {invoice.is_deposit_invoice && (
                    <div className="flex justify-between py-2">
                      <span className="font-medium">Deposit Amount:</span>
                      <span>{formatMoney(invoice.deposit_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatMoney(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card - only show if there are actual notes */}
          {invoice.notes && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
                <p className="whitespace-pre-line">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Terms Card */}
          {invoice.terms && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h3>
                <p className="whitespace-pre-line">{invoice.terms}</p>
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
