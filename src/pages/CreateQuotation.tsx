
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { QuotationItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { quotationService, customerService } from "@/services";
import { Customer } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CreateQuotation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<QuotationItem[]>([
    { id: 1, description: "", category: "Other Items", quantity: 1, unit: "Unit", unitPrice: 0, amount: 0 }
  ]);

  const initialCustomerId = location.state?.customerId || "";
  const [customerId, setCustomerId] = useState(initialCustomerId);
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 30
  });

  const generateReferenceNumber = () => {
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `QT-${currentYear}-${randomNum.toString().padStart(5, '0')}`;
  };

  const [documentNumber, setDocumentNumber] = useState(generateReferenceNumber());

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
        subject: subject || null,
        terms: null,
        requires_deposit: depositInfo.requiresDeposit,
        deposit_amount: depositInfo.requiresDeposit ? depositInfo.depositAmount : 0,
        deposit_percentage: depositInfo.requiresDeposit ? depositPercentage : 0
      };
      
      const createdQuotation = await quotationService.create(quotation);
      
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
      
      toast({
        title: status === "Sent" ? "Quotation Sent" : "Quotation Created",
        description: `Quotation for ${customer?.name} has been ${status === "Sent" ? "sent" : "created"} successfully.`,
      });
      
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
        
        <AdditionalInfoCard 
          notes={notes}
          setNotes={setNotes}
          onSubmit={(e) => handleSubmit(e, e.currentTarget === document.activeElement ? "Sent" : "Draft")}
          onCancel={() => navigate("/quotations")}
          documentType="quotation"
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );
}
