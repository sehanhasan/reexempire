import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { QuotationItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoForm } from "@/components/quotations/AdditionalInfoForm";
import { invoiceService, quotationService } from "@/services";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CreateInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
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
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment is due within 3 days from the date of this invoice");
  const [subject, setSubject] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 50
  });
  const [quotationReference, setQuotationReference] = useState<string | undefined>(undefined);

  useEffect(() => {
    const generateInvoiceNumber = () => {
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, "0");
      return `INV-${timestamp}${randomNum}`;
    };

    setDocumentNumber(generateInvoiceNumber());

    // Check if we're creating from a quotation
    const quotationData = location.state?.quotation;
    if (quotationData) {
      setCustomerId(quotationData.customer_id);
      setSubject(quotationData.subject || "");
      setNotes(quotationData.notes || "");
      setTerms(quotationData.terms || "Payment is due within 3 days from the date of this invoice");
      setQuotationReference(quotationData.reference_number);
      
      // Load quotation items
      quotationService.getItemsByQuotationId(quotationData.id).then(quotationItems => {
        if (quotationItems && quotationItems.length > 0) {
          const mappedItems = quotationItems.map((item, index) => ({
            id: index + 1,
            description: item.description,
            category: item.category || "Other Items",
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unit_price,
            amount: item.amount
          }));
          setItems(mappedItems);
        }
      }).catch(error => {
        console.error("Error loading quotation items:", error);
      });

      if (quotationData.requires_deposit) {
        setDepositInfo({
          requiresDeposit: true,
          depositAmount: quotationData.deposit_amount,
          depositPercentage: quotationData.deposit_percentage
        });
      }
    }
  }, [location.state]);

  const calculateItemAmount = (item: QuotationItem) => {
    const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
    return qty * item.unitPrice;
  };

  const handleSubmit = async (e: React.FormEvent, status: string = "Draft") => {
    e.preventDefault();
    if (!customerId) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before creating the invoice.",
        variant: "destructive"
      });
      return;
    }

    const validItems = items.filter(item => item.description && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast({
        title: "Missing Items",
        description: "Please add at least one item to the invoice.",
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

      const invoice = {
        customer_id: customerId,
        reference_number: documentNumber,
        issue_date: invoiceDate,
        due_date: dueDate,
        status: status,
        subtotal: subtotal,
        total: subtotal,
        notes: notes || null,
        terms: terms || null,
        subject: subject || null,
        quotation_id: location.state?.quotation?.id || null,
        quotation_ref_number: quotationReference || null,
        tax_rate: 0,
        tax_amount: 0,
        is_deposit_invoice: depositInfo.requiresDeposit,
        deposit_amount: depositInfo.requiresDeposit ? depositInfo.depositAmount : 0,
        deposit_percentage: depositInfo.requiresDeposit ? depositInfo.depositPercentage : 0,
        payment_status: "Unpaid"
      };

      const createdInvoice = await invoiceService.create(invoice);

      for (const item of validItems) {
        const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
        await invoiceService.createItem({
          invoice_id: createdInvoice.id,
          description: item.description,
          quantity: qty,
          unit: item.unit,
          unit_price: item.unitPrice,
          amount: qty * item.unitPrice,
          category: item.category
        });
      }

      toast({
        title: "Invoice Created",
        description: `Invoice ${documentNumber} has been created successfully.`
      });

      navigate("/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "There was an error creating the invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="page-container">
      <PageHeader 
        title="Create Invoice"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </div>
        } 
      />

      <form className="mt-8 space-y-6">
        <CustomerInfoCard 
          customerId={customerId} 
          setCustomer={setCustomerId} 
          documentType="invoice" 
          documentNumber={documentNumber} 
          setDocumentNumber={setDocumentNumber} 
          documentDate={invoiceDate} 
          setDocumentDate={setInvoiceDate} 
          expiryDate={dueDate} 
          setExpiryDate={setDueDate} 
          subject={subject} 
          setSubject={setSubject} 
          quotationReference={quotationReference}
        />
        
        <QuotationItemsCard 
          items={items} 
          setItems={setItems} 
          depositInfo={depositInfo} 
          setDepositInfo={setDepositInfo} 
          calculateItemAmount={calculateItemAmount} 
        />
        
        <AdditionalInfoForm 
          terms={terms}
          setTerms={setTerms}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/invoices")} 
          documentType="invoice" 
          isSubmitting={isSubmitting}
          showDraft={true}
        />
      </form>
    </div>;
}
