import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { InvoiceItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoForm } from "@/components/quotations/AdditionalInfoForm";
import { invoiceService, customerService, quotationService } from "@/services";
import { Customer } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CreateInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: "", category: "", quantity: 1, unit: "Unit", unitPrice: 0, amount: 0 }
  ]);

  const initialCustomerId = location.state?.customerId || "";
  const initialQuotationId = location.state?.quotationId || "";
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [quotationId, setQuotationId] = useState(initialQuotationId);
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [isDepositInvoice, setIsDepositInvoice] = useState(false);
  const [quotationRefNumber, setQuotationRefNumber] = useState<string | null>(null);
  
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 50
  });

  const generateReferenceNumber = async (isDepositInvoice: boolean = false) => {
    const currentYear = new Date().getFullYear();
    try {
      const invoices = await invoiceService.getAll();
      
      const currentYearInvoices = invoices?.filter(i => 
        i.reference_number?.startsWith(`INV-${currentYear}`)
      ) || [];
      
      const nextNumber = currentYearInvoices.length + 1;
      const sequence = nextNumber.toString().padStart(4, '0');
      return isDepositInvoice ? `INV-${currentYear}-${sequence}-A` : `INV-${currentYear}-${sequence}`;
    } catch (error) {
      console.error('Error generating reference number:', error);
      return `INV-${currentYear}-0001`;
    }
  };

  const [documentNumber, setDocumentNumber] = useState("");

  useEffect(() => {
    const initializeReferenceNumber = async () => {
      const refNumber = await generateReferenceNumber(isDepositInvoice);
      setDocumentNumber(refNumber);
    };
    initializeReferenceNumber();
  }, [isDepositInvoice]);

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
  
  useEffect(() => {
    if (quotationId) {
      const fetchQuotation = async () => {
        try {
          const quotation = await quotationService.getById(quotationId);
          if (quotation) {
            setQuotationRefNumber(quotation.reference_number);
            setCustomerId(quotation.customer_id);
            setInvoiceDate(quotation.issue_date);
            setDueDate(quotation.expiry_date);
            setNotes(quotation.notes || "");
            setTerms(quotation.terms || "");
            setSubject(quotation.subject || "");
            setDepositInfo({
              requiresDeposit: quotation.requires_deposit || false,
              depositAmount: quotation.deposit_amount || 0,
              depositPercentage: quotation.deposit_percentage || 50
            });
            
            const quotationItems = await quotationService.getItemsByQuotationId(quotationId);
            if (quotationItems && quotationItems.length > 0) {
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
        } catch (error) {
          console.error("Error fetching quotation:", error);
        }
      };
      
      fetchQuotation();
    }
  }, [quotationId]);

  // Add effect to auto-update deposit amount when items change
  useEffect(() => {
    if (depositInfo.requiresDeposit) {
      const subtotal = items.reduce((sum, item) => {
        const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
        return sum + (qty * item.unitPrice);
      }, 0);
      
      const depositPercentage = typeof depositInfo.depositPercentage === 'string' 
        ? parseFloat(depositInfo.depositPercentage) 
        : depositInfo.depositPercentage;
      
      const newDepositAmount = (subtotal * depositPercentage) / 100;
      
      if (newDepositAmount !== depositInfo.depositAmount) {
        setDepositInfo(prev => ({
          ...prev,
          depositAmount: newDepositAmount
        }));
      }
    }
  }, [items, depositInfo.requiresDeposit, depositInfo.depositPercentage]);

  const calculateItemAmount = (item: InvoiceItem) => {
    const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
    return qty * item.unitPrice;
  };

  const handleSubmit = async (e: React.FormEvent, status: string = "Draft") => {
    e.preventDefault();
    
    if (!customerId) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before creating an invoice.",
        variant: "destructive",
      });
      return;
    }
    
    const validItems = items.filter(item => item.description && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast({
        title: "Missing Items",
        description: "Please add at least one item to the invoice.",
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
      
      const invoice = {
        quotation_id: quotationId || null,
        customer_id: customerId,
        reference_number: documentNumber,
        issue_date: invoiceDate,
        due_date: dueDate,
        subtotal: subtotal,
        tax_rate: 6,
        tax_amount: subtotal * 0.06,
        total: subtotal * 1.06,
        status: status,
        payment_status: "Unpaid",
        notes: notes || null,
        terms: terms || null,
        payment_method: paymentMethod,
        is_deposit_invoice: isDepositInvoice,
        deposit_amount: depositInfo.requiresDeposit ? depositInfo.depositAmount : 0,
        deposit_percentage: depositInfo.requiresDeposit ? depositPercentage : 0,
        subject: subject || null,
        quotation_ref_number: quotationRefNumber || null
      };
      
      const createdInvoice = await invoiceService.create(invoice);
      setCreatedInvoiceId(createdInvoice.id);
      
      // Preserve the original order of items
      for (const item of items) {
        if (item.description && item.unitPrice > 0) {
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
      }
      
      toast({
        title: "Invoice Created",
        description: `Invoice for ${customer?.name} has been created as ${status}.`,
      });
      
      navigate("/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "There was an error creating the invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
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

      <form className="mt-2 space-y-6">
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
    </div>
  );
}
