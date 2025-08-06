import { useState, useEffect, Dispatch, SetStateAction, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, Share2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { InvoiceItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoForm } from "@/components/quotations/AdditionalInfoForm";
import { invoiceService, customerService } from "@/services";
import { Customer, Invoice } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";
import { shareViaWhatsApp } from "@/utils/shareUtils";

interface ExtendedInvoice extends Invoice {
  subject?: string | null;
}

export default function EditInvoice() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<InvoiceItem[]>([{
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
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [terms, setTerms] = useState("");
  const [subject, setSubject] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [status, setStatus] = useState("Draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 50
  });
  const [originalItemOrder, setOriginalItemOrder] = useState<{[key: number]: number}>({});

  useEffect(() => {
    if (!id) return;
    const fetchInvoiceData = async () => {
      try {
        setIsLoading(true);

        const invoice = await invoiceService.getById(id);
        if (invoice) {
          setInvoiceData(invoice);
          setCustomerId(invoice.customer_id);
          setDocumentNumber(invoice.reference_number);
          setInvoiceDate(invoice.issue_date);
          setDueDate(invoice.due_date);
          setTerms(invoice.terms || "");
          setSubject((invoice as ExtendedInvoice).subject || "");
          setStatus(invoice.status);

          setDepositInfo({
            requiresDeposit: invoice.requires_deposit || false,
            depositAmount: invoice.deposit_amount || 0,
            depositPercentage: invoice.deposit_percentage || 50
          });

          if (invoice.customer_id) {
            const customerData = await customerService.getById(invoice.customer_id);
            setCustomer(customerData);
          }

          const invoiceItems = await invoiceService.getItemsByInvoiceId(id);
          if (invoiceItems && invoiceItems.length > 0) {
            const orderMap: {[key: number]: number} = {};
            invoiceItems.forEach((item, index) => {
              orderMap[index + 1] = index;
            });
            setOriginalItemOrder(orderMap);
            
            setItems(invoiceItems.map((item, index) => ({
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
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to fetch invoice data. Please try again.",
          variant: "destructive"
        });
        navigate("/invoices");
      }
    };
    fetchInvoiceData();
  }, [id, navigate]);

  const calculateItemAmount = (item: InvoiceItem) => {
    const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
    return qty * item.unitPrice;
  };

  const handleSubmit = async (e: React.FormEvent, newStatus?: string) => {
    e.preventDefault();
    if (!customerId || !id) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before updating the invoice.",
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

    try {
      setIsSubmitting(true);

      const depositPercentageValue = typeof depositInfo.depositPercentage === 'string' 
        ? parseFloat(depositInfo.depositPercentage) 
        : depositInfo.depositPercentage;

      const invoice = {
        customer_id: customerId,
        reference_number: documentNumber,
        issue_date: invoiceDate,
        due_date: dueDate,
        status: newStatus || status,
        subtotal: subtotal,
        total: subtotal,
        notes: null,
        terms: terms || null,
        subject: subject || null,
        requires_deposit: depositInfo.requiresDeposit,
        deposit_amount: depositInfo.requiresDeposit ? depositInfo.depositAmount : 0,
        deposit_percentage: depositInfo.requiresDeposit ? depositPercentageValue : 0
      };

      await invoiceService.update(id, invoice);

      await invoiceService.deleteAllItems(id);

      const sortedItems = [...items].sort((a, b) => {
        if (originalItemOrder[a.id] !== undefined && originalItemOrder[b.id] !== undefined) {
          return originalItemOrder[a.id] - originalItemOrder[b.id];
        }
        if (originalItemOrder[a.id] !== undefined) return -1;
        if (originalItemOrder[b.id] !== undefined) return 1;
        return a.id - b.id;
      });

      for (const item of sortedItems) {
        if (item.description && item.unitPrice > 0) {
          const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
          await invoiceService.createItem({
            invoice_id: id,
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
          title: "Invoice Update Sent",
          description: `Invoice for ${customer?.name} has been updated and sent successfully.`
        });
        
        // Open WhatsApp after successful update
        try {
          const invoiceViewUrl = `${window.location.origin}/invoices/view/${id}`;
          
          const message = `Dear ${customer?.name || ''},\n\n` +
            `Please find your invoice ${documentNumber} for review at the link below: ` +
            `${invoiceViewUrl}\n\n` +
            `You can review the invoice details and make payment.\n\n` +
            `If you have any questions, please don't hesitate to contact us.\n\n` +
            `Thank you,\nReex Empire Sdn Bhd`;
          
          shareViaWhatsApp(message);
        } catch (error) {
          console.error("Error opening WhatsApp:", error);
          toast({
            title: "WhatsApp Error",
            description: "Invoice updated successfully, but failed to open WhatsApp. You can share it manually.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Invoice Updated",
          description: `Invoice for ${customer?.name} has been updated successfully.`
        });
      }

      navigate("/invoices");
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "There was an error updating the invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      await invoiceService.update(id, {
        status: newStatus
      });
      setStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Invoice status has been updated to "${newStatus}".`
      });

      if (newStatus === "Paid") {
        toast({
          title: "Invoice Paid",
          description: "The invoice has been marked as paid."
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendWhatsapp = () => {
    if (!invoiceData || !customer) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const invoiceViewUrl = `${window.location.origin}/invoices/view/${id}`;
      
      const message = `Dear ${customer.name},\n\n` +
        `Please find your invoice ${invoiceData.reference_number} for review at the link below: ` +
        `${invoiceViewUrl}\n\n` +
        `You can review the invoice details and make payment.\n\n` +
        `If you have any questions, please don't hesitate to contact us.\n\n` +
        `Thank you,\nReex Empire Sdn Bhd`;
      
      shareViaWhatsApp(message);
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="page-container">
        <PageHeader title="Edit Invoice" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>;
  }

  return <div className="page-container">
      <PageHeader 
        title="Edit Invoice"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </div>
        } 
      />

      {status === "Sent" && <div className="rounded-md p-4 mt-4 bg-white">
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="font-medium">Invoice Status: <span className="text-amber-600">Sent</span></h3>
              <p className="text-sm text-muted-foreground">Update the status of this invoice</p>
            </div>
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row justify-end'} gap-2`}>
              <Button 
                variant="outline" 
                className={`${isMobile ? 'w-full' : ''} border-red-200 bg-red-50 hover:bg-red-100 text-red-600`} 
                onClick={() => handleStatusChange("Rejected")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Mark as Rejected
              </Button>
              <Button 
                variant="outline" 
                className={`${isMobile ? 'w-full' : ''} border-green-200 bg-green-50 hover:bg-green-100 text-green-600`} 
                onClick={() => handleStatusChange("Paid")}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Paid
              </Button>
              <Button 
                variant="outline" 
                className={`${isMobile ? 'w-full' : ''} border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600`} 
                onClick={handleSendWhatsapp}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share via WhatsApp
              </Button>
            </div>
          </div>
        </div>}

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
          onTermsChange={setTerms}
          requiresDeposit={depositInfo.requiresDeposit}
          onDepositToggle={(value) => setDepositInfo(prev => ({ ...prev, requiresDeposit: value }))}
          depositPercentage={Number(depositInfo.depositPercentage)}
          onDepositPercentageChange={(value) => setDepositInfo(prev => ({ ...prev, depositPercentage: value }))}
          depositAmount={depositInfo.depositAmount}
          onDepositAmountChange={(value) => setDepositInfo(prev => ({ ...prev, depositAmount: value }))}
          subtotal={items.reduce((sum, item) => {
            const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity as string) || 1 : item.quantity;
            return sum + (qty * item.unitPrice);
          }, 0)}
        />
      </form>
    </div>;
}
