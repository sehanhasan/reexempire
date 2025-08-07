
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { QuotationItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoForm } from "@/components/quotations/AdditionalInfoForm";
import { quotationService, customerService } from "@/services";
import { useIsMobile } from "@/hooks/use-mobile";
import { shareQuotation } from "@/utils/mobileShare";

export default function CreateQuotation() {
  const navigate = useNavigate();
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
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [subject, setSubject] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 50
  });

  const calculateItemAmount = (item: QuotationItem) => {
    const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
    return qty * item.unitPrice;
  };

  const handleSubmit = async (e: React.FormEvent, newStatus?: string, shouldShare = false) => {
    e.preventDefault();
    
    if (!customerId) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before creating the quotation.",
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
      return sum + (qty * item.unitPrice);
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
        status: newStatus || "Draft",
        subtotal: subtotal,
        total: subtotal,
        notes: notes || null,
        terms: terms || null,
        subject: subject || null,
        requires_deposit: depositInfo.requiresDeposit,
        deposit_amount: depositInfo.requiresDeposit ? depositInfo.depositAmount : 0,
        deposit_percentage: depositInfo.requiresDeposit ? depositPercentageValue : 0
      };

      const createdQuotation = await quotationService.create(quotation);
      
      for (const item of validItems) {
        if (item.description && item.unitPrice > 0) {
          const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
          await quotationService.createItem({
            quotation_id: createdQuotation.id,
            description: item.description,
            quantity: qty,
            unit: item.unit,
            unit_price: item.unitPrice,
            amount: qty * item.unitPrice,
            category: item.category
          });
        }
      }

      if (shouldShare && newStatus === "Sent") {
        try {
          const customer = await customerService.getById(customerId);
          if (customer) {
            await shareQuotation(createdQuotation.id, documentNumber, customer.name);
            toast({
              title: "Quotation Created & Shared",
              description: "Quotation has been created and shared successfully!"
            });
          }
        } catch (shareError) {
          console.error("Error sharing quotation:", shareError);
          toast({
            title: "Quotation Created",
            description: "Quotation created successfully, but sharing failed. You can share it from the quotations list.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Success",
          description: `Quotation created successfully${newStatus === "Sent" ? " and sent" : ""}.`
        });
      }

      navigate("/quotations");
    } catch (error) {
      console.error("Error creating quotation:", error);
      toast({
        title: "Error",
        description: "There was an error creating the quotation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendQuotation = (e: React.FormEvent) => {
    handleSubmit(e, "Sent", true);
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Create Quotation" 
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => navigate("/quotations")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quotations
            </Button>
          </div>
        } 
      />

      <form className="mt-8 space-y-6">
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
        
        <AdditionalInfoForm 
          terms={terms} 
          setTerms={setTerms} 
          onSubmit={handleSubmit}
          onCancel={() => navigate("/quotations")}
          documentType="quotation"
          isSubmitting={isSubmitting}
          showDraft={true}
          extraActions={
            <Button 
              type="button" 
              onClick={handleSendQuotation}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Sending...' : 'Send Quotation'}
            </Button>
          }
        />
      </form>
    </div>
  );
}
