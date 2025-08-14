import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, CheckCircle, XCircle } from "lucide-react";
import { quotationService, customerService } from "@/services";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { shareQuotation } from "@/utils/mobileShare";
import { captureViewAsPDF } from "@/utils/htmlToPdf";

export default function ViewQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchQuotationData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [quotationData, itemsData] = await Promise.all([
          quotationService.getById(id),
          quotationService.getItemsByQuotationId(id),
        ]);

        if (quotationData) {
          setQuotation(quotationData);
          setItems(itemsData || []);
          document.title = `Quotation #${quotationData.reference_number} - Reex Empire`;

          if (quotationData.customer_id) {
            const customerData = await customerService.getById(
              quotationData.customer_id
            );
            setCustomer(customerData);
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load quotation",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuotationData();
    const interval = setInterval(fetchQuotationData, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      document.title = "Reex Empire";
    };
  }, [id]);

  const formatMoney = (amount) =>
    `RM ${parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatAmount = (amount) =>
    parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleDownloadPDF = async () => {
    if (!quotation) return;
    try {
      setIsDownloading(true);
      const filename = `quotation-${quotation.reference_number}.pdf`;
      await captureViewAsPDF('quotation-view', filename, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      toast({
        title: "Success",
        description: "Quotation PDF downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!quotation || !customer) {
      toast({
        title: "Missing Information",
        description: "Quotation or customer information not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      await shareQuotation(quotation.id, quotation.reference_number, customer.name);
      toast({
        title: "Success",
        description: "Quotation shared successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share quotation",
        variant: "destructive",
      });
    }
  };

  const handleAccept = async () => {
    if (!quotation) return;
    try {
      await quotationService.update(quotation.id, { status: "Accepted" });
      setQuotation({ ...quotation, status: "Accepted" });
      toast({
        title: "Success",
        description: "Quotation accepted!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept quotation",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!quotation) return;
    try {
      await quotationService.update(quotation.id, { status: "Rejected" });
      setQuotation({ ...quotation, status: "Rejected" });
      toast({
        title: "Success",
        description: "Quotation rejected!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject quotation",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status) => {
    if (status === "Accepted")
      return "bg-green-100 text-green-800 hover:bg-green-100";
    if (status === "Rejected")
      return "bg-red-100 text-red-800 hover:bg-red-100";
    return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <p>Loading quotation details...</p>
      </div>
    );
  }

  if (!quotation || !customer) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Quotation Not Found</h2>
        <Button onClick={() => navigate("/")}>Return Home</Button>
      </div>
    );
  }

  const groupedItems = {};
  items.forEach((item) => {
    const category = item.category || "Other Items";
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });

  const categories = Object.keys(groupedItems).sort();

  return (
    <div className="min-h-screen bg-background">
      <div className="py-4 px-4" id="quotation-view">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <img
                  src="https://i.ibb.co/Ltyts5K/reex-empire-logo.png"
                  alt="Reex Empire Logo"
                  className="h-16 w-auto mb-3"
                />
                <h2 className="text-sm font-bold text-gray-900 mb-2">
                  Reex Empire Sdn Bhd (1426553-A)
                </h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>No. 29-1, Jalan 2A/6, Taman Setapak Indah</p>
                  <p>53300 Setapak Kuala Lumpur</p>
                  <p className="text-gray-800">www.reexempire.com</p>
                </div>
                {quotation.subject && (
                  <div className="mt-3 pt-2 border-t">
                    <p className="text-sm text-gray-800 font-semibold mb-1">
                      Subject: {quotation.subject}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-3">
                  <h1 className="text-xl font-bold text-gray-900">
                    Quotation #{quotation.reference_number}
                  </h1>
                  <Badge className={`mb-1 ${getStatusColor(quotation.status)}`}>
                    {quotation.status}
                  </Badge>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Issued:</strong>{" "}
                      {format(new Date(quotation.issue_date), "MMM dd, yyyy")}
                    </p>
                    <p>
                      <strong>Valid Until:</strong>{" "}
                      {format(new Date(quotation.expiry_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="w-64 bg-gray-100 p-3 rounded-lg text-sm">
                  <p className="text-lg font-bold text-gray-500 font-medium mb-1">
                    Bill To
                  </p>
                  <div className="text-sm text-gray-800 space-y-1">
                    <p>Attn: {customer.name}</p>
                    {customer.unit_number && (
                      <p className="font-semibold">{customer.unit_number}</p>
                    )}
                    {customer.address && <p>{customer.address}</p>}
                    {customer.city && (
                      <p>
                        {customer.city}, {customer.state} {customer.postal_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2 font-semibold text-gray-700">
                        Description
                      </th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-16">
                        Price
                      </th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-16">
                        Qty
                      </th>
                      <th className="text-right p-2 font-semibold text-gray-700 w-24">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, categoryIndex) => (
                      <React.Fragment key={category}>
                        <tr className="bg-blue-50 border-t border-b">
                          <td
                            colSpan={4}
                            className="p-2 font-semibold text-blue-800 text-sm"
                          >
                            {categoryIndex + 1}- {category}
                          </td>
                        </tr>
                        {groupedItems[category].map((item, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="p-2 text-gray-800">
                              {item.description}
                            </td>
                            <td className="text-right p-2 text-gray-800">
                              {formatAmount(item.unit_price)}
                            </td>
                            <td className="text-right p-2 text-gray-800">
                              {item.quantity}
                            </td>
                            <td className="text-right p-2 font-semibold text-gray-800">
                              {formatAmount(item.amount)}
                            </td>
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
                      <div className="flex justify-between">
                        <span className="font-medium">
                          Deposit ({quotation.deposit_percentage}%):
                        </span>
                        <span>{formatMoney(quotation.deposit_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t pt-1">
                      <span>Total:</span>
                      <span className="text-blue-600">
                        {formatMoney(quotation.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {quotation.notes && (
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      Notes
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">{quotation.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              {quotation.terms && (
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      Terms & Conditions
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">{quotation.terms}</p>
                  </CardContent>
                </Card>
              )}
              <div className="text-center text-gray-600 text-sm py-3 bg-gray-50 rounded-lg">
                <p>For all enquiries, please contact Khalil Pasha</p>
                <p>
                  Email: reexsb@gmail.com Tel: 011-1665 6525 / 019-999 1024
                </p>
                <div className="text-center text-gray-500 text-xs py-3">
                  <p>
                    &copy; {new Date().getFullYear()} Reex Empire Sdn Bhd. All
                    rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center flex gap-4 justify-center">
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>

            <Button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
              Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
