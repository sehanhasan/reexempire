
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { QuotationItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { generateQuotationPDF, downloadPDF } from "@/utils/pdfGenerator";
import { quotationService, customerService } from "@/services";
import { Customer } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CreateQuotation() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<QuotationItem[]>([
    { id: 1, description: "", quantity: 1, unit: "Unit", unitPrice: 0, amount: 0 }
  ]);

  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [documentNumber, setDocumentNumber] = useState("QT-" + Math.floor(Math.random() * 10000).toString().padStart(4, '0'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 30
  });

  // Fetch customer details when customer ID changes
  useEffect(() => {
    if (customerId) {
      const fetchCustomer = async () => {
        try {
          const customerData = await customerService.getById(customerId);
          setCustomer(customerData);
          
          // Auto-fill unit number if available
          if (customerData?.unit_number) {
            setUnitNumber(customerData.unit_number);
          }
        } catch (error) {
          console.error("Error fetching customer:", error);
        }
      };
      
      fetchCustomer();
    }
  }, [customerId]);

  const calculateItemAmount = (item: QuotationItem) => {
    return item.quantity * item.unitPrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before creating a quotation.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    try {
      setIsSubmitting(true);
      
      // Create quotation in database
      const quotation = {
        customer_id: customerId,
        reference_number: documentNumber,
        issue_date: quotationDate,
        expiry_date: validUntil,
        status: "Draft",
        subtotal: subtotal,
        total: subtotal, // No tax for quotations
        notes: notes || null,
        terms: null,
        requires_deposit: depositInfo.requiresDeposit,
        deposit_amount: depositInfo.requiresDeposit ? depositInfo.depositAmount : 0,
        deposit_percentage: depositInfo.requiresDeposit ? depositInfo.depositPercentage : 0
      };
      
      const createdQuotation = await quotationService.create(quotation);
      
      // Add quotation items
      for (const item of items) {
        if (item.description && item.unitPrice > 0) {
          await quotationService.createItem({
            quotation_id: createdQuotation.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unitPrice,
            amount: item.quantity * item.unitPrice
          });
        }
      }
      
      toast({
        title: "Quotation Created",
        description: `Quotation for ${customer?.name} has been created successfully.`,
      });
      
      // Navigate back to the quotations list
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

  const handleConvertToInvoice = () => {
    // In a real app, this would create an invoice from the quotation data
    // For this demo, we'll just navigate to the invoice creation page
    toast({
      title: "Convert to Invoice",
      description: "This would convert the quotation to an invoice in a real app.",
    });
    
    navigate("/invoices/create");
  };

  const handleDownloadPDF = () => {
    if (!customerId || !customer) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before downloading the PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdf = generateQuotationPDF({
        documentNumber: documentNumber,
        documentDate: quotationDate,
        customerName: customer.name,
        unitNumber: unitNumber,
        expiryDate: validUntil,
        validUntil: validUntil,
        notes: notes,
        items: items,
        subject: subject,
        depositInfo: depositInfo
      });
      
      downloadPDF(pdf, `Quotation_${documentNumber}_${customer.name.replace(/\s+/g, '_')}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Quotation PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Create Quotation"
        description="Create a new quotation for a customer."
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => navigate("/quotations")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quotations
            </Button>
            <Button variant="secondary" onClick={handleDownloadPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <CustomerInfoCard 
          customer={customerId}
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
          unitNumber={unitNumber}
          setUnitNumber={setUnitNumber}
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
          onConvertToInvoice={handleConvertToInvoice}
          documentType="quotation"
        />
      </form>
    </div>
  );
}
