
import { useState } from "react";
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

export default function CreateQuotation() {
  const navigate = useNavigate();
  const [items, setItems] = useState<QuotationItem[]>([
    { id: 1, description: "", quantity: 1, unit: "Unit", unitPrice: 0, amount: 0 }
  ]);

  const [customer, setCustomer] = useState("");
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 30
  });

  const calculateItemAmount = (item: QuotationItem) => {
    return item.quantity * item.unitPrice;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would save to the database
    toast({
      title: "Quotation Created",
      description: `Quotation for ${customer} has been created successfully.`,
    });
    
    // Navigate back to the quotations list
    navigate("/quotations");
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
    if (!customer) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before downloading the PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdf = generateQuotationPDF({
        documentNumber: "QT-0001",
        documentDate: quotationDate,
        customerName: customer,
        unitNumber: unitNumber,
        expiryDate: validUntil,
        validUntil: validUntil,
        notes: notes,
        items: items,
        subject: subject,
        depositInfo: depositInfo
      });
      
      downloadPDF(pdf, `Quotation_QT-0001_${customer.replace(/\s+/g, '_')}.pdf`);
      
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
          <div className="flex gap-2">
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
          customer={customer}
          setCustomer={setCustomer}
          documentType="quotation"
          documentNumber="QT-0001"
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
