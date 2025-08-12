import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { QuotationItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoForm } from "@/components/quotations/AdditionalInfoForm";
import { invoiceService, quotationService, customerService } from "@/services";
import { Customer } from "@/types/database";
import { shareInvoice } from "@/utils/mobileShare";

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quotationId = searchParams.get("quotation_id");
  
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
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [subject, setSubject] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [status, setStatus] = useState("Draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotationReference, setQuotationReference] = useState("");
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 50
  });

  useEffect(() => {
    if (quotationId) {
      const loadQuotationData = async () => {
        try {
          console.log("Loading quotation data for ID:", quotationId);
          const quotation = await quotationService.getById(quotationId);
          
          if (quotation) {
            console.log("Quotation data loaded:", quotation);
            setQuotationReference(quotation.reference_number);
            setCustomerId(quotation.customer_id);
            setSubject(quotation.subject || "");
            setTerms(quotation.terms || "");
            
            // Fetch customer data
            if (quotation.customer_id) {
              const customerData = await customerService.getById(quotation.customer_id);
              setCustomer(customerData);
            }

            // Fetch quotation items
            const quotationItems = await quotationService.getItemsByQuotationId(quotationId);
            if (quotationItems && quotationItems.length > 0) {
              console.log("Quotation items loaded:", quotationItems);
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

            // Handle deposit information
            if (quotation.requires_deposit) {
              setDepositInfo({
                requiresDeposit: true,
                depositAmount: quotation.deposit_amount || 0,
                depositPercentage: quotation.deposit_percentage || 50
              });
            }
          }
        } catch (error) {
          console.error("Error loading quotation data:", error);
          toast({
            title: "Error",
            description: "Failed to load quotation data. Please try again.",
            variant: "destructive"
          });
        }
      };
      
      loadQuotationData();
    }
  }, [quotationId]);

  useEffect(() => {
    const generateInvoiceNumber = async () => {
      try {
        const number = await invoiceService.generateInvoiceNumber();
        setDocumentNumber(number);
        console.log("Generated invoice number:", number);
      } catch (error) {
        console.error("Error generating invoice number:", error);
        toast({
          title: "Error",
          description: "Failed to generate invoice number. Please refresh the page.",
          variant: "destructive"
        });
      }
    };

    if (!quotationId) {
      generateInvoiceNumber();
    }
  }, [quotationId]);

  const calculateItemAmount = (item: QuotationItem) => {
    const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
    return qty * item.unitPrice;
  };

  const handleSubmit = async (e: React.FormEvent, newStatus?: string) => {
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

    const taxRate = 6.00; // Default tax rate
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    try {
      setIsSubmitting(true);

      const invoice = {
        quotation_id: quotationReference || null,
        customer_id: customerId,
        reference_number: documentNumber,
        issue_date: invoiceDate,
        due_date: dueDate,
        status: newStatus || status,
        subtotal: subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total: total,
        notes: notes || null,
        terms: terms || null,
        subject: subject || null,
        is_deposit_invoice: depositInfo.requiresDeposit,
        deposit_amount: depositInfo.requiresDeposit ? depositInfo.depositAmount : 0,
        deposit_percentage: depositInfo.requiresDeposit ? (typeof depositInfo.depositPercentage === 'string' ? parseFloat(depositInfo.depositPercentage) : depositInfo.depositPercentage) : 0,
        payment_status: 'Unpaid'
      };

      console.log("Creating invoice with data:", invoice);
      const createdInvoice = await invoiceService.create(invoice);
      console.log("Invoice created:", createdInvoice);

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

      if (newStatus === "Sent") {
        toast({
          title: "Invoice Created and Sent",
          description: `Invoice for ${customer?.name} has been created and sent successfully.`
        });
        
        // Use mobile-friendly share function after successful creation
        try {
          await shareInvoice(createdInvoice.id, documentNumber, customer?.name || '');
        } catch (error) {
          console.error("Error sharing invoice:", error);
          toast({
            title: "Share Error",
            description: "Invoice created successfully, but failed to share. You can share it manually from the invoices list.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Invoice Created",
          description: `Invoice for ${customer?.name} has been created successfully.`
        });
      }

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

  return (
    <div className="page-container">
      <PageHeader 
        title="Create Invoice"
        actions={
          <Button variant="outline" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
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
        />
      </form>
    </div>
  );
}
