
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { QuotationItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { generateQuotationPDF } from "@/utils/pdfGenerator";

export default function CreateQuotation() {
  const navigate = useNavigate();
  const [items, setItems] = useState<QuotationItem[]>([
    { id: 1, description: "", quantity: 1, unit: "Unit", unitPrice: 0, amount: 0, category: "" }
  ]);

  const [customer, setCustomer] = useState("");
  const [subject, setSubject] = useState("");
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  
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

  const handleGeneratePDF = () => {
    generateQuotationPDF({
      customer,
      subject,
      quotationNumber: "QT-0001",
      quotationDate,
      validUntil,
      items,
      notes,
      depositInfo,
      total: items.reduce((sum, item) => sum + item.amount, 0)
    });
    
    toast({
      title: "PDF Generated",
      description: "Quotation PDF has been generated successfully.",
    });
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
            <Button variant="outline" onClick={handleGeneratePDF}>
              <FileText className="mr-2 h-4 w-4" />
              Generate PDF
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
