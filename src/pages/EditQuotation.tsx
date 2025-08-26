import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, CheckCircle, XCircle, Share2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { QuotationItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoForm } from "@/components/quotations/AdditionalInfoForm";
import { quotationService, customerService } from "@/services";
import { Customer, Quotation } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExtendedQuotation extends Quotation {
  subject?: string | null;
}

interface QuotationWithCustomer extends Quotation {
  customer_name: string;
  unit_number?: string;
}

export default function EditQuotation() {
  const navigate = useNavigate();
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<QuotationItem[]>([{
    id: 1,
    description: "",
    category: "",
    quantity: 1,
    unit: "",
    unitPrice: 0,
    amount: 0
  }]);
  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotationData, setQuotationData] = useState<Quotation | null>(null);
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [subject, setSubject] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [status, setStatus] = useState("Draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 50
  });
  const [originalItemOrder, setOriginalItemOrder] = useState<{
    [key: number]: number;
  }>({});

  useEffect(() => {
    if (!id) return;
    const fetchQuotationData = async () => {
      try {
        setIsLoading(true);
        const quotation = await quotationService.getById(id);
        if (quotation) {
          setQuotationData(quotation);
          setCustomerId(quotation.customer_id);
          setDocumentNumber(quotation.reference_number);
          setQuotationDate(quotation.issue_date);
          setValidUntil(quotation.expiry_date);
          setNotes(quotation.notes || "");
          setTerms(quotation.terms || "");
          setSubject((quotation as ExtendedQuotation).subject || "");
          setStatus(quotation.status);
          setDepositInfo({
            requiresDeposit: quotation.requires_deposit || false,
            depositAmount: quotation.deposit_amount || 0,
            depositPercentage: quotation.deposit_percentage || 50
          });
          if (quotation.customer_id) {
            const customerData = await customerService.getById(quotation.customer_id);
            setCustomer(customerData);
          }
          const quotationItems = await quotationService.getItemsByQuotationId(id);
          if (quotationItems && quotationItems.length > 0) {
            const orderMap: {
              [key: number]: number;
            } = {};
            quotationItems.forEach((item, index) => {
              orderMap[index + 1] = index;
            });
            setOriginalItemOrder(orderMap);
            setItems(quotationItems.map((item, index) => ({
              id: index + 1,
              description: item.description,
              category: item.category || "Other Items",
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unit_price,
              amount: item.amount
            })));
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching quotation:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to fetch quotation data. Please try again.",
          variant: "destructive"
        });
        navigate("/quotations");
      }
    };
    fetchQuotationData();
  }, [id, navigate]);

  const calculateItemAmount = (item: QuotationItem) => {
    const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
    return qty * item.unitPrice;
  };

  const handleSubmit = async (e: React.FormEvent, newStatus?: string) => {
    e.preventDefault();
    if (!customerId || !id) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before updating the quotation.",
        variant: "destructive"
      });
      return;
    }
    const validItems = items.filter(item => item.description && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast({
        title: "Missing Items",
        description: "Please add at least one item to the quotation.",
        variant: "destructive"
      });
      return;
    }
    const subtotal = items.reduce((sum, item) => {
      const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
      return sum + qty * item.unitPrice;
    }, 0);
    try {
      setIsSubmitting(true);
      const depositPercentageValue = typeof depositInfo.depositPercentage === 'string' ? parseFloat(depositInfo.depositPercentage) : depositInfo.depositPercentage;
      const quotation = {
        customer_id: customerId,
        reference_number: documentNumber,
        issue_date: quotationDate,
        expiry_date: validUntil,
        status: newStatus || status,
        subtotal: subtotal,
        total: subtotal,
        notes: notes || null,
        terms: terms || null,
        subject: subject || null,
        requires_deposit: depositInfo.requiresDeposit,
        deposit_amount: depositInfo.requiresDeposit ? depositInfo.depositAmount : 0,
        deposit_percentage: depositInfo.requiresDeposit ? depositPercentageValue : 0
      };
      await quotationService.update(id, quotation);
      await quotationService.deleteAllItems(id);
      const sortedItems = [...items].sort((a, b) => {
        if (originalItemOrder[a.id] !== undefined && originalItemOrder[b.id] !== undefined) {
          return originalItemOrder[a.id] - originalItemOrder[b.id];
        }
        if (originalItemOrder[a.id] !== undefined) return -1;
        if (originalItemOrder[b.id] !== undefined) return 1;
        return a.id - b.id;
      });
      for (const item of sortedItems) {
        if (item.description && item.unitPrice > 0) {
          const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
          await quotationService.createItem({
            quotation_id: id,
            description: item.description,
            quantity: qty,
            unit: item.unit,
            unit_price: item.unitPrice,
            amount: qty * item.unitPrice,
            category: item.category
          });
        }
      }
      if (newStatus === "Sent") {
        toast({
          title: "Quotation Update Sent",
          description: `Updated quotation for ${customer?.name} has been sent successfully.`
        });

        // Use window.location.href for better WebView/APK compatibility
        try {
          const quotationViewUrl = `${window.location.origin}/quotations/view/${id}`;
          const whatsAppUrl = quotationService.generateWhatsAppShareUrl(id, documentNumber, customer?.name || '', quotationViewUrl);
          window.location.href = whatsAppUrl;
        } catch (error) {
          console.error("Error opening WhatsApp:", error);
          toast({
            title: "WhatsApp Error",
            description: "Quotation updated successfully, but failed to open WhatsApp. You can share it manually.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Quotation Updated",
          description: `Quotation for ${customer?.name} has been updated successfully.`
        });
      }
      navigate("/quotations");
    } catch (error) {
      console.error("Error updating quotation:", error);
      toast({
        title: "Error",
        description: "There was an error updating the quotation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertToInvoice = (quotation: QuotationWithCustomer) => {
    navigate("/invoices/create", {
      state: {
        quotationId: quotation.id
      }
    });
  };
  
  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      await quotationService.update(id, {
        status: newStatus
      });
      setStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Quotation status has been updated to "${newStatus}".`
      });
      if (newStatus === "Accepted") {
        toast({
          title: "Quotation Accepted",
          description: "You can now convert this quotation to an invoice."
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update quotation status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendWhatsapp = () => {
    if (!quotationData || !customer) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive"
      });
      return;
    }
    try {
      const quotationViewUrl = `${window.location.origin}/quotations/view/${id}`;
      const whatsAppUrl = quotationService.generateWhatsAppShareUrl(id!, quotationData.reference_number, customer.name, quotationViewUrl);
      window.location.href = whatsAppUrl;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
        <PageHeader title="Edit Quotation" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>;
  }

  return <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      <PageHeader title="Edit Quotation" actions={<div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => navigate(`/quotations/view/${id}`)}>
              <FileText className="mr-2 h-4 w-4" />
              View Quotation
            </Button>
          </div>} />

      {/* Status sections for different quotation statuses */}
      {(status === "Sent" || status === "Accepted" || status === "Rejected") && (
        <div className="rounded-md p-4 mt-1 bg-white">
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="font-medium">
                Quotation Status:{" "}
                <span className={
                  status === "Sent" ? "text-amber-600" : 
                  status === "Accepted" ? "text-green-600" : 
                  status === "Rejected" ? "text-red-600" : "text-gray-600"
                }>
                  {status}
                </span>
              </h3>
              {status === "Sent" && (
                <p className="text-sm text-muted-foreground">
                  Update the status of this quotation
                </p>
              )}
              {status === "Rejected" && (
                <p className="text-sm text-muted-foreground">
                  This quotation has been rejected. You can share it again or create a new version.
                </p>
              )}
            </div>

            <div className={`flex ${isMobile ? "flex-col" : "flex-row justify-end"} gap-2`}>
              {/* Actions for Sent status */}
              {status === "Sent" && (
                <>
                  <Button
                    variant="outline"
                    className={`${isMobile ? "w-full" : ""} border-red-200 bg-red-50 hover:bg-red-100 text-red-600`}
                    onClick={() => handleStatusChange("Rejected")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark as Rejected
                  </Button>

                  <Button
                    variant="outline"
                    className={`${isMobile ? "w-full" : ""} border-green-200 bg-green-50 hover:bg-green-100 text-green-600`}
                    onClick={() => handleStatusChange("Accepted")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Accepted
                  </Button>

                  {/* <Button
                    variant="outline"
                    className={`${isMobile ? "w-full" : ""} border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600`}
                    onClick={handleSendWhatsapp}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share via WhatsApp
                  </Button> */}
                </>
              )}

              {/* Actions for Accepted status */}
              {status === "Accepted" && (
                <>
                  {/* <Button
                    variant="outline"
                    className={`${isMobile ? "w-full" : ""} border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600`}
                    onClick={handleSendWhatsapp}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share via WhatsApp
                  </Button> */}

                  <Button
                    variant="outline"
                    className={`${isMobile ? "w-full" : ""} border-green-200 bg-green-50 hover:bg-green-100 text-green-600`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConvertToInvoice(quotationData as QuotationWithCustomer);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                </>
              )}

              {/* Actions for Rejected status */}
              {status === "Rejected" && (
                <>
                  <Button
                    variant="outline"
                    className={`${isMobile ? "w-full" : ""} border-green-200 bg-green-50 hover:bg-green-100 text-green-600`}
                    onClick={() => handleStatusChange("Sent")}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Resend Quotation
                  </Button>

                  {/* <Button
                    variant="outline"
                    className={`${isMobile ? "w-full" : ""} border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600`}
                    onClick={handleSendWhatsapp}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share via WhatsApp
                  </Button> */}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <form className="mt-8 space-y-6">
        <CustomerInfoCard customerId={customerId} setCustomer={setCustomerId} documentType="quotation" documentNumber={documentNumber} setDocumentNumber={setDocumentNumber} documentDate={quotationDate} setDocumentDate={setQuotationDate} expiryDate={validUntil} setExpiryDate={setValidUntil} subject={subject} setSubject={setSubject} />
        
        <QuotationItemsCard items={items} setItems={setItems} depositInfo={depositInfo} setDepositInfo={setDepositInfo} calculateItemAmount={calculateItemAmount} />
        
        <AdditionalInfoForm 
          terms={terms} 
          setTerms={setTerms} 
          onSubmit={handleSubmit} 
          onCancel={() => navigate("/quotations")} 
          documentType="quotation" 
          isSubmitting={isSubmitting} 
          showDraft={false}
          documentId={id}
          documentNumber={documentNumber}
          customerName={customer?.name}
          isEditMode={true}
        />
      </form>
    </div>;
}
