
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar, User, MapPin, Phone, Mail } from "lucide-react";
import { invoiceService, customerService } from "@/services";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

export default function ViewInvoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
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
        setIsLoading(false);
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

  const getStatusColor = (status) => {
    if (status === "Paid") return "bg-green-100 text-green-800";
    if (status === "Partially Paid") return "bg-amber-100 text-amber-800";
    if (status === "Overdue") return "bg-red-100 text-red-600";
    return "bg-amber-100 text-amber-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600">The invoice you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Check if invoice is overdue
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  const isPastDue = dueDate < today && invoice.payment_status !== "Paid";
  const displayPaymentStatus = isPastDue && invoice.payment_status === "Unpaid" ? "Overdue" : invoice.payment_status;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Invoice</h1>
          <p className="text-gray-600 mt-2">Reference: {invoice.reference_number}</p>
        </div>

        {/* Invoice Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Invoice Details
              </CardTitle>
              <Badge className={getStatusColor(displayPaymentStatus)}>
                {displayPaymentStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Issue Date:</span>
                    <span className="ml-2 font-medium">
                      {format(new Date(invoice.issue_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Due Date:</span>
                    <span className={`ml-2 font-medium ${isPastDue ? "text-red-600" : ""}`}>
                      {format(dueDate, "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Subject:</span>
                    <p className="font-medium">{invoice.subject || "No subject"}</p>
                  </div>
                  {invoice.is_deposit_invoice && (
                    <div>
                      <span className="text-sm text-gray-600">Deposit Amount:</span>
                      <p className="font-medium text-blue-600">{formatMoney(invoice.deposit_amount)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        {customer && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg">{customer.name}</h3>
                  {customer.unit_number && (
                    <p className="text-gray-600">Unit: {customer.unit_number}</p>
                  )}
                  {customer.address && (
                    <div className="flex items-start mt-2">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm">{customer.address}</p>
                        {customer.city && (
                          <p className="text-sm">
                            {customer.city}{customer.state && `, ${customer.state}`} {customer.postal_code}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {customer.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{customer.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2 w-20">Qty</th>
                    <th className="text-right py-2 w-24">Unit Price</th>
                    <th className="text-right py-2 w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id || index} className="border-b">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          {item.category && (
                            <p className="text-sm text-gray-500">{item.category}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-right py-3">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="text-right py-3">
                        {formatMoney(item.unit_price)}
                      </td>
                      <td className="text-right py-3 font-medium">
                        {formatMoney(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{formatMoney(invoice.subtotal)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({invoice.tax_rate}%):</span>
                  <span className="font-medium">{formatMoney(invoice.tax_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatMoney(invoice.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              {invoice.notes && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Notes:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="font-semibold mb-2">Terms & Conditions:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{invoice.terms}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="text-center">
          <Button variant="outline" className="mr-4">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
