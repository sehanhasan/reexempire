
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown, Save, Send } from "lucide-react"; // Add Send import
import { toast } from "@/components/ui/use-toast";
import { QuotationItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { generateQuotationPDF, downloadPDF } from "@/utils/pdfGenerator";
import { quotationService, customerService } from "@/services";
import { Customer } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";

export default function EditQuotation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
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
  const [documentNumber, setDocumentNumber] = useState("");
  const [status, setStatus] = useState("Draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 30
  });

  // Fetch quotation data
  useEffect(() => {
    if (!id) return;

    const fetchQuotationData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch quotation details
        const quotation = await quotationService.getById(id);
        if (quotation) {
          setCustomerId(quotation.customer_id);
          setDocumentNumber(quotation.reference_number);
          setQuotationDate(quotation.issue_date);
          setValidUntil(quotation.expiry_date);
          setNotes(quotation.notes || "");
          setStatus(quotation.status);
          
          // Set deposit info
          setDepositInfo({
            requiresDeposit: quotation.requires_deposit || false,
            depositAmount: quotation.deposit_amount || 0,
            depositPercentage: quotation.deposit_percentage || 30
          });
          
          // Fetch customer details
          if (quotation.customer_id) {
            const customerData = await customerService.getById(quotation.customer_id);
            setCustomer(customerData);
            
            if (customerData?.unit_number) {
              setUnitNumber(customerData.unit_number);
            }
          }
          
          // Fetch quotation items
          const quotationItems = await quotationService.getItemsByQuotationId(id);
          if (quotationItems && quotationItems.length > 0) {
            setItems(quotationItems.map((item, index) => ({
              id: index + 1,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unit_price,
              amount: item.amount
            })));
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching quotation:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to fetch quotation data. Please try again.",
          variant: "destructive",
        });
        navigate("/quotations");
      }
    };
    
    fetchQuotationData();
  }, [id, navigate]);

  const calculateItemAmount = (item: QuotationItem) => {
    return item.quantity * item.unitPrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId || !id) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before updating the quotation.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that there are at least one item with a value
    const validItems = items.filter(item => item.description && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast({
        title: "Missing Items",
        description: "Please add at least one item to the quotation.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    try {
      setIsSubmitting(true);
      
      // Update quotation in database
      const quotation = {
        customer_id: customerId,
        reference_number: documentNumber,
        issue_date: quotationDate,
        expiry_date: validUntil,
        status: status,
        subtotal: subtotal,
        total: subtotal, // No tax for quotations
        notes: notes || null,
        requires_deposit: depositInfo.requiresDeposit,
        deposit_amount: depositInfo.requiresDeposit ? depositInfo.depositAmount : 0,
        deposit_percentage: depositInfo.requiresDeposit ? depositInfo.depositPercentage : 0
      };
      
      await quotationService.update(id, quotation);
      
      // Delete all existing items and add the new ones
      await quotationService.deleteAllItems(id);
      
      // Add updated quotation items
      for (const item of items) {
        if (item.description && item.unitPrice > 0) {
          await quotationService.createItem({
            quotation_id: id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unitPrice,
            amount: item.quantity * item.unitPrice
          });
        }
      }
      
      toast({
        title: "Quotation Updated",
        description: `Quotation for ${customer?.name} has been updated successfully.`,
      });
      
      // Navigate back to the quotations list
      navigate("/quotations");
    } catch (error) {
      console.error("Error updating quotation:", error);
      toast({
        title: "Error",
        description: "There was an error updating the quotation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

  const handleSendWhatsapp = () => {
    if (!customerId || !customer) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before sending the quotation.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format phone number (remove any non-digit characters)
      let phoneNumber = customer.phone?.replace(/\D/g, '') || '';
      
      if (!phoneNumber) {
        toast({
          title: "Missing Phone Number",
          description: "Customer doesn't have a phone number for WhatsApp.",
          variant: "destructive",
        });
        return;
      }
      
      // Make sure phone number starts with country code
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '6' + phoneNumber; // Adding Malaysia country code
      } else if (!phoneNumber.startsWith('6')) {
        phoneNumber = '60' + phoneNumber;
      }
      
      // WhatsApp message text
      const message = `Dear ${customer.name},\n\nPlease find attached Quotation ${documentNumber}.\n\nThank you.`;
      
      // Open WhatsApp web with the prepared message
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
      
      toast({
        title: "WhatsApp Opened",
        description: "WhatsApp has been opened with the quotation message. The document PDF will need to be attached manually.",
      });
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader
          title="Edit Quotation"
          description="Loading quotation data..."
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Edit Quotation"
        description="Update an existing quotation."
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
          // Remove the readOnly prop as it's not in the interface
        />
        
        <QuotationItemsCard 
          items={items}
          setItems={setItems}
          depositInfo={depositInfo}
          setDepositInfo={setDepositInfo}
          calculateItemAmount={calculateItemAmount}
        />
        
        <div className="flex flex-col md:flex-row gap-4 justify-end">
          <Button 
            variant="default" // Change 'primary' to 'default' as per available variants
            type="submit"
            disabled={isSubmitting}
            className="flex items-center"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
          <Button 
            variant="outline" 
            type="button"
            onClick={handleSendWhatsapp}
            className="flex items-center bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
          >
            <Send className="mr-2 h-4 w-4" />
            Send via WhatsApp
          </Button>
        </div>
      </form>
    </div>
  );
}
