
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { InvoiceItem } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { InvoiceItemsCard } from "@/components/quotations/InvoiceItemsCard";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { generateInvoicePDF, downloadPDF } from "@/utils/pdfGenerator";
import { invoiceService, customerService } from "@/services";
import { Customer } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";

export default function EditInvoice() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [isDepositInvoice, setIsDepositInvoice] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositPercentage, setDepositPercentage] = useState(30);
  const [quotationReference, setQuotationReference] = useState("");
  const [quotationId, setQuotationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentNumber, setDocumentNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [originalItemOrder, setOriginalItemOrder] = useState<{[key: number]: number}>({});
  const [originalItems, setOriginalItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!id) {
        navigate("/invoices");
        return;
      }

      try {
        setIsLoading(true);
        const invoice = await invoiceService.getById(id);
        
        if (invoice) {
          setCustomerId(invoice.customer_id);
          setDocumentNumber(invoice.reference_number);
          setInvoiceDate(invoice.issue_date);
          setDueDate(invoice.due_date);
          setNotes(invoice.notes || "");
          setSubject(invoice.subject || "");
          setIsDepositInvoice(invoice.is_deposit_invoice || false);
          setDepositAmount(invoice.deposit_amount || 0);
          setDepositPercentage(invoice.deposit_percentage || 30);
          
          if (invoice.quotation_id) {
            setQuotationId(invoice.quotation_id);
            
            try {
              const quotation = await invoiceService.getById(invoice.quotation_id);
              if (quotation) {
                setQuotationReference(quotation.reference_number);
              }
            } catch (error) {
              console.error("Error fetching quotation:", error);
            }
          }
          
          const invoiceItems = await invoiceService.getItemsByInvoiceId(id);
          if (invoiceItems && invoiceItems.length > 0) {
            // Save the original order and items to preserve ordering
            const orderMap: {[key: number]: number} = {};
            const formattedItems = invoiceItems.map((item, index) => {
              const id = index + 1;
              orderMap[id] = index;
              return {
                id,
                description: item.description,
                category: item.category || "",
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unit_price,
                amount: item.amount
              };
            });
            
            setOriginalItemOrder(orderMap);
            setOriginalItems(formattedItems);
            setItems(formattedItems);
          }
        } else {
          toast({
            title: "Invoice Not Found",
            description: "The invoice you're trying to edit doesn't exist.",
            variant: "destructive",
          });
          navigate("/invoices");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast({
          title: "Error",
          description: "Failed to load invoice data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoiceData();
  }, [id, navigate]);

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

  const calculateItemAmount = (item: InvoiceItem) => {
    const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
    return qty * item.unitPrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before saving the invoice.",
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
    const total = isDepositInvoice ? depositAmount : subtotal;
    
    try {
      setIsSubmitting(true);
      
      await invoiceService.update(id!, {
        customer_id: customerId,
        quotation_id: quotationId,
        reference_number: documentNumber,
        issue_date: invoiceDate,
        due_date: dueDate,
        subtotal: subtotal,
        tax_rate: 0,
        tax_amount: 0,
        total: total,
        notes: notes || null,
        subject: subject || null,
        terms: null,
        is_deposit_invoice: isDepositInvoice,
        deposit_amount: isDepositInvoice ? depositAmount : 0,
        deposit_percentage: isDepositInvoice ? depositPercentage : 0
      });
      
      await invoiceService.deleteAllItems(id!);
      
      // Map current items to their original position for ordering
      const currentToOriginalMap = new Map();
      
      // Find original items still present in the current items
      for (const item of items) {
        const originalItem = originalItems.find(oi => oi.id === item.id);
        if (originalItem) {
          const originalPosition = originalItemOrder[originalItem.id];
          currentToOriginalMap.set(item.id, originalPosition);
        }
      }
      
      // Sort items to maintain original order as much as possible
      const sortedItems = [...items].sort((a, b) => {
        const posA = currentToOriginalMap.has(a.id) ? currentToOriginalMap.get(a.id) : 9999;
        const posB = currentToOriginalMap.has(b.id) ? currentToOriginalMap.get(b.id) : 9999;
        
        if (posA === 9999 && posB === 9999) {
          // Both items are new, sort by ID
          return a.id - b.id;
        }
        
        return posA - posB;
      });
      
      for (const item of sortedItems) {
        if (item.description && item.unitPrice > 0) {
          const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
          await invoiceService.createItem({
            invoice_id: id!,
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
        title: "Invoice Updated",
        description: `Invoice for ${customer?.name} has been updated successfully.`,
      });
      
      navigate("/invoices");
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "There was an error updating the invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsapp = () => {
    if (!customerId || !customer) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before sending the invoice.",
        variant: "destructive",
      });
      return;
    }

    try {
      let phoneNumber = customer.phone?.replace(/\D/g, '') || '';
      
      if (!phoneNumber) {
        toast({
          title: "Missing Phone Number",
          description: "Customer doesn't have a phone number for WhatsApp.",
          variant: "destructive",
        });
        return;
      }
      
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '6' + phoneNumber;
      } else if (!phoneNumber.startsWith('6')) {
        phoneNumber = '60' + phoneNumber;
      }
      
      const message = `Dear ${customer.name},\n\nPlease find attached Invoice ${documentNumber}.\n\nThank you.`;
      
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
      
      toast({
        title: "WhatsApp Opened",
        description: "WhatsApp has been opened with the invoice message. The document PDF will need to be attached manually.",
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
      const pdf = generateInvoicePDF({
        documentNumber: documentNumber,
        documentDate: invoiceDate,
        customerName: customer.name,
        unitNumber: customer.unit_number || "",
        expiryDate: dueDate,
        dueDate: dueDate,
        paymentMethod: "",
        notes: notes,
        items: items,
        subject: subject,
        isDepositInvoice: isDepositInvoice,
        depositAmount: depositAmount,
        depositPercentage: depositPercentage,
        quotationReference: quotationReference
      });
      
      downloadPDF(pdf, `Invoice_${documentNumber}_${customer.name.replace(/\s+/g, '_')}.pdf`);
      
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

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Edit Invoice"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => navigate("/invoices")} className={isMobile ? "mobile-hide-back" : ""}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
            <Button variant="secondary" onClick={handleDownloadPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="default" onClick={handleSendWhatsapp}>
              <Send className="mr-2 h-4 w-4" />
              Send to WhatsApp
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
          onSendWhatsapp={handleSendWhatsapp}
          saveButtonText="Update Invoice"
        />
      </form>
    </div>
  );
}
