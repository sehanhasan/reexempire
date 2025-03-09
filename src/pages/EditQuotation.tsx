import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, CheckCircle, XCircle, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { QuotationItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { quotationService, customerService } from "@/services";
import { Customer, Quotation } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExtendedQuotation extends Quotation {
  subject?: string | null;
}

export default function EditQuotation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<QuotationItem[]>([{
    id: 1,
    description: "",
    category: "",
    quantity: 1,
    unit: "Unit",
    unitPrice: 0,
    amount: 0
  }]);
  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [status, setStatus] = useState("Draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 30
  });
  const [originalItemOrder, setOriginalItemOrder] = useState<{[key: number]: number}>({});

  useEffect(() => {
    if (!id) return;
    const fetchQuotationData = async () => {
      try {
        setIsLoading(true);

        const quotation = await quotationService.getById(id);
        if (quotation) {
          setCustomerId(quotation.customer_id);
          setDocumentNumber(quotation.reference_number);
          setQuotationDate(quotation.issue_date);
          setValidUntil(quotation.expiry_date);
          setNotes(quotation.notes || "");
          
          setSubject((quotation as ExtendedQuotation).subject || ""); 
          setStatus(quotation.status);

          setDepositInfo({
            requiresDeposit: quotation.requires_deposit || false,
            depositAmount: quotation.deposit_amount || 0,
            depositPercentage: quotation.deposit_percentage || 30
          });

          if (quotation.customer_id) {
            const customerData = await customerService.getById(quotation.customer_id);
            setCustomer(customerData);
          }

          const quotationItems = await quotationService.getItemsByQuotationId(id);
          if (quotationItems && quotationItems.length > 0) {
            const orderMap: {[key: number]: number} = {};
            quotationItems.forEach((item, index) => {
              orderMap[index + 1] = index;
            });
            setOriginalItemOrder(orderMap);
            
            setItems(quotationItems.map((item, index) => ({
              id: index + 1,
              description: item.description,
              category: item.category || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
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

      const depositPercentageValue = typeof depositInfo.depositPercentage === 'string' 
        ? parseFloat(depositInfo.depositPercentage) 
        : depositInfo.depositPercentage;

      const quotation = {
        customer_id: customerId,
        reference_number: documentNumber,
        issue_date: quotationDate,
        expiry_date: validUntil,
        status: status,
        subtotal: subtotal,
        total: subtotal,
        notes: notes || null,
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

      toast({
        title: "Quotation Updated",
        description: `Quotation for ${customer?.name} has been updated successfully.`
      });

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

  const handleConvertToInvoice = () => {
    navigate("/invoices/create", {
      state: {
        quotationId: id
      }
    });
  };

  if (isLoading) {
    return <div className="page-container">
        <PageHeader title="Edit Quotation" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>;
  }

  return <div className="page-container">
      <PageHeader 
        title="Edit Quotation"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => navigate("/quotations")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quotations
            </Button>
          </div>
        } 
      />

      {status === "Sent" && <div className="rounded-md p-4 mt-4 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h3 className="font-medium">Quotation Status: <span className="text-amber-600">Sent</span></h3>
              <p className="text-sm text-muted-foreground">Update the status of this quotation</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-red-200 bg-red-50 hover:bg-red-100 text-red-600" onClick={() => handleStatusChange("Rejected")}>
                <XCircle className="mr-2 h-4 w-4" />
                Mark as Rejected
              </Button>
              <Button variant="outline" className="border-green-200 bg-green-50 hover:bg-green-100 text-green-600" onClick={() => handleStatusChange("Accepted")}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Accepted
              </Button>
            </div>
          </div>
        </div>}

      {status === "Accepted" && <div className="rounded-md p-4 mt-4 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h3 className="font-medium">Quotation Status: <span className="text-green-600">Accepted</span></h3>
              <p className="text-sm text-muted-foreground">This quotation has been accepted by the customer</p>
            </div>
            <div>
              <Button onClick={handleConvertToInvoice} className="bg-blue-600 hover:bg-blue-700">
                <FileText className="mr-2 h-4 w-4" />
                Convert to Invoice
              </Button>
            </div>
          </div>
        </div>}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <CustomerInfoCard 
          customerId={customerId} 
          setCustomer={setCustomerId} 
          documentType="quotation" 
          documentNumber={documentNumber} 
          setDocumentNumber={setDocumentNumber} 
          documentDate={quotationDate} 
          setDocumentDate={setQuotationDate} 
          expiryDate={validUntil} 
          setExpiryDate={setValidUntil} 
          subject={subject} 
          setSubject={setSubject} 
        />
        
        <QuotationItemsCard 
          items={items} 
          setItems={setItems} 
          depositInfo={depositInfo} 
          setDepositInfo={setDepositInfo} 
          calculateItemAmount={calculateItemAmount} 
        />
        
        <AdditionalInfoCard 
          notes={notes} 
          setNotes={setNotes} 
          onSubmit={handleSubmit} 
          onCancel={() => navigate("/quotations")} 
          documentType="quotation" 
          isSubmitting={isSubmitting} 
          saveButtonText="Update Quotation" 
        />
      </form>
    </div>;
}
