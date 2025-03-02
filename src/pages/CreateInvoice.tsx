
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { InvoiceItem } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { InvoiceItemsCard } from "@/components/quotations/InvoiceItemsCard";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { generateInvoicePDF, downloadPDF } from "@/utils/pdfGenerator";

export default function CreateInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: "", quantity: 1, unit: "Unit", unitPrice: 0, amount: 0 }
  ]);

  const [customer, setCustomer] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [isDepositInvoice, setIsDepositInvoice] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositPercentage, setDepositPercentage] = useState(30); // Default 30%
  const [quotationReference, setQuotationReference] = useState("");

  // Check if this invoice is being created from a quotation
  useEffect(() => {
    // In a real app, you would get the quotation ID from the URL or state
    // and then fetch the quotation data from the API
    const fromQuotation = location.state?.fromQuotation;
    if (fromQuotation) {
      // Populate invoice with quotation data
      // This is just a demo placeholder
      setQuotationReference("QT-0001");
      toast({
        title: "Created from Quotation",
        description: "Invoice has been pre-filled with quotation data.",
      });
    }
  }, [location]);

  const calculateItemAmount = (item: InvoiceItem) => {
    return item.quantity * item.unitPrice;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would save to the database
    toast({
      title: "Invoice Created",
      description: `Invoice for ${customer} has been created successfully.`,
    });
    
    // Navigate back to the invoices list
    navigate("/invoices");
  };

  const handleDownloadPDF = () => {
    if (!customer) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before downloading the PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdf = generateInvoicePDF({
        documentNumber: "INV-0001",
        documentDate: invoiceDate,
        customerName: customer,
        unitNumber: unitNumber,
        expiryDate: dueDate,
        dueDate: dueDate,
        paymentMethod: paymentMethod,
        notes: notes,
        items: items,
        subject: subject,
        isDepositInvoice: isDepositInvoice,
        depositAmount: depositAmount,
        depositPercentage: depositPercentage,
        quotationReference: quotationReference
      });
      
      downloadPDF(pdf, `Invoice_INV-0001_${customer.replace(/\s+/g, '_')}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Invoice PDF has been downloaded successfully.",
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
        title="Create Invoice"
        description="Create a new invoice for a customer."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
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
          customer={customer}
          setCustomer={setCustomer}
          documentType="invoice"
          documentNumber="INV-0001"
          documentDate={invoiceDate}
          setDocumentDate={setInvoiceDate}
          expiryDate={dueDate}
          setExpiryDate={setDueDate}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          quotationReference={quotationReference}
          subject={subject}
          setSubject={setSubject}
          unitNumber={unitNumber}
          setUnitNumber={setUnitNumber}
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
        />
      </form>
    </div>
  );
}
