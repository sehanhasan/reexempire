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
import { quotationService, customerService } from "@/services";
import { Customer } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";
import { shareQuotation } from "@/utils/mobileShare";

export default function CreateQuotation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<QuotationItem[]>([
    { id: 1, description: "", category: "", quantity: 1, unit: "Unit", unitPrice: 0, amount: 0 }
  ]);

  const initialCustomerId = location.state?.customerId || "";
  const [customerId, setCustomerId] = useState(initialCustomerId);
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdQuotationId, setCreatedQuotationId] = useState<string | null>(null);
  
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 50
  });

  const generateReferenceNumber = async () => {
    const currentYear = new Date().getFullYear();
    try {
      const quotations = await quotationService.getAll();
      
      const currentYearQuotations = quotations?.filter(q => 
        q.reference_number?.startsWith(`QT-${currentYear}`)
      ) || [];
      
      const nextNumber = currentYearQuotations.length + 1;
      return `QT-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating reference number:', error);
      return `QT-${currentYear}-0001`;
    }
  };

  const [documentNumber, setDocumentNumber] = useState("");

  useEffect(() => {
    const initializeReferenceNumber = async () => {
      const refNumber = await generateReferenceNumber();
      setDocumentNumber(refNumber);
    };
    initializeReferenceNumber();
  }, []);

  useEffect(() => {
    if (customerId) {
      const fetchCustomer = async () => {
        try {
          const customerData = await customerService.getById(customerId);
          setCustomer(customerData);
        } catch (error) {
          console.error("Error fetching customer:", error);
        }
      };
      
      fetchCustomer();
    }
  }, [customerId]);

  const calculateItemAmount = (item: QuotationItem) => {
    const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
    return qty * item.unitPrice;
  };

  const handleSendWhatsapp = async () => {
    if (!createdQuotationId || !customer) {
      toast({
        title: "Error",
        description: "Quotation must be saved before sharing.",
        variant: "destructive"
      });
      return;
    }
    try {
      await shareQuotation(createdQuotationId, documentNumber, customer.name);
    } catch (error) {
      console.error("Error sharing:", error);
      toast({ title: "Error", description: "Failed to share.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: string = "Draft") => {
    e.preventDefault();
    
    if (!customerId) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before creating a quotation.",
        variant: "destructive",
      });
      return;
    }
    
    const validItems = items.filter(item => item.description && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast({
        title: "Missing Items",
        description: "Please add at least one item to the quotation.",
        variant: "destructive",
      });
      return;
    }
    
    const subtotal = items.reduce((sum, item) => {
      const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
      return sum + (qty * item.unitPrice);
    }, 0);
    
    try {
      setIsSubmitting(true);
      
      const depositPercentage = typeof depositInfo.depositPercentage === 'string' 
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
        terms: terms || null,
        subject: subject || null,
        requires_deposit: depositInfo.requiresDeposit,
        deposit_amount: depositInfo.requiresDeposit ? depositInfo.depositAmount : 0,
        deposit_percentage: depositInfo.requiresDeposit ? depositPercentage : 0
      };
      
      const createdQuotation = await quotationService.create(quotation);
      setCreatedQuotationId(createdQuotation.id);
      
      // Preserve the original order of items
      for (const item of items) {
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
      
      if (status === "Sent") {
        toast({
          title: "Quotation Sent",
          description: `Quotation for ${customer?.name} has been sent successfully.`,
        });
        try {
          await shareQuotation(createdQuotation.id, documentNumber, customer!.name);
        } catch (error) {
          console.error("Error sharing:", error);
          toast({
            title: "Share Error",
            description: "Quotation saved successfully, but sharing failed.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Quotation Created",
          description: `Quotation for ${customer?.name} has been created as Draft.`,
        });
      }
      
      navigate("/quotations");
    } catch (error) {
      console.error("Error creating quotation:", error);
      toast({
        title: "Error",
        description: "There was an error creating the quotation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          onSendWhatsapp={handleSendWhatsapp}
        />
      </form>
    </div>
  );
}
