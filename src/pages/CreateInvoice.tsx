
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { InvoiceItem } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { InvoiceItemsCard } from "@/components/quotations/InvoiceItemsCard";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
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

  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [isDepositInvoice, setIsDepositInvoice] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositPercentage, setDepositPercentage] = useState(30); // Default 30%
  const [quotationReference, setQuotationReference] = useState("");
  const [quotationId, setQuotationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate reference number with year - INV-2025-00001 format
  const generateReferenceNumber = () => {
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `INV-${currentYear}-${randomNum.toString().padStart(5, '0')}`;
  };

  const [documentNumber, setDocumentNumber] = useState(generateReferenceNumber());

  // Fetch customer details when customer ID changes
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

  // Check if this invoice is being created from a quotation
  useEffect(() => {
    const fetchQuotationData = async () => {
      // In a real app, you would get the quotation ID from the URL or state
      const fromQuotationId = location.state?.quotationId;
      
      if (fromQuotationId) {
        try {
          // Fetch quotation details
          const quotation = await quotationService.getById(fromQuotationId);
          if (quotation) {
            setQuotationId(quotation.id);
            setQuotationReference(quotation.reference_number);
            setCustomerId(quotation.customer_id);
            setSubject(quotation.subject || "");
            
            // Set deposit info
            setIsDepositInvoice(quotation.requires_deposit || false);
            setDepositAmount(quotation.deposit_amount || 0);
            setDepositPercentage(quotation.deposit_percentage || 30);
            
            // Fetch quotation items
            const quotationItems = await quotationService.getItemsByQuotationId(quotation.id);
            if (quotationItems && quotationItems.length > 0) {
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
            
            toast({
              title: "Created from Quotation",
              description: "Invoice has been pre-filled with quotation data.",
            });
          }
        } catch (error) {
          console.error("Error fetching quotation:", error);
        }
      }
    };
    
    fetchQuotationData();
  }, [location]);

  const calculateItemAmount = (item: InvoiceItem) => {
    const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
    return qty * item.unitPrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before creating an invoice.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that there are at least one item with a value
    const validItems = items.filter(item => item.description && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast({
        title: "Missing Items",
        description: "Please add at least one item to the invoice.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
      return sum + (qty * item.unitPrice);
    }, 0);
    const total = isDepositInvoice ? depositAmount : subtotal;
    
    try {
      setIsSubmitting(true);
      
      // Create invoice in database
      const invoice = {
        customer_id: customerId,
        quotation_id: quotationId,
        reference_number: documentNumber,
        issue_date: invoiceDate,
        due_date: dueDate,
        status: "Draft",
        subtotal: subtotal,
        tax_rate: 0, // No SST as requested
        tax_amount: 0,
        total: total,
        notes: notes || null,
        subject: subject || null, // Added subject field
        terms: null,
        is_deposit_invoice: isDepositInvoice,
        deposit_amount: isDepositInvoice ? depositAmount : 0,
        deposit_percentage: isDepositInvoice ? depositPercentage : 0,
        payment_status: "Unpaid"
      };
      
      
      const createdInvoice = await invoiceService.create(invoice);
      
      // Add invoice items (preserving order)
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
            category: item.category // Include category field
          });
        }
      }
      
      toast({
        title: "Invoice Created",
        description: `Invoice for ${customer?.name} has been created successfully.`,
      });
      
      // Navigate back to the invoices list
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

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          quotationReference={quotationReference}
          subject={subject}
          setSubject={setSubject}
        />
        
        <InvoiceItemsCard 
          items={items}
          setItems={setItems}
          isDepositInvoice={isDepositInvoice}
          setIsDepositInvoice={setIsDepositInvoice}
          depositAmount={depositAmount}
          setDepositAmount={setDepositAmount}
          depositPercentage={depositPercentage}
          setDepositPercentage={setDepositPercentage}
          calculateItemAmount={calculateItemAmount}
        />
        
        <AdditionalInfoCard 
          notes={notes}
          setNotes={setNotes}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/invoices")}
          documentType="invoice"
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );
}
