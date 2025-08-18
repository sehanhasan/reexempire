
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { InvoiceItemsCard } from "@/components/quotations/InvoiceItemsCard";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { invoiceService, customerService } from "@/services";
import { Customer, Invoice, InvoiceItem } from "@/types/database";
import { WorkPhotosCard } from "@/components/invoices/WorkPhotosCard";
import { InvoiceItem as InvoiceItemType } from "./types";

export default function EditInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<InvoiceItemType[]>([]);
  const [isDepositInvoice, setIsDepositInvoice] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositPercentage, setDepositPercentage] = useState(30);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (id) {
        try {
          const invoiceData = await invoiceService.getById(id);
          setInvoice(invoiceData);
          setIsDepositInvoice(invoiceData.is_deposit_invoice);
          setDepositAmount(invoiceData.deposit_amount);
          setDepositPercentage(invoiceData.deposit_percentage);
          setNotes(invoiceData.notes || "");
          setTerms(invoiceData.terms || "");

          const customerData = await customerService.getById(invoiceData.customer_id);
          setCustomer(customerData);

          const invoiceItems = await invoiceService.getItemsByInvoiceId(id);
          // Convert InvoiceItem to InvoiceItemType format
          const convertedItems = invoiceItems.map(item => ({
            id: parseInt(item.id),
            description: item.description,
            category: item.category || "Other Items",
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unit_price,
            amount: item.amount
          }));
          setItems(convertedItems);
        } catch (error) {
          console.error("Error fetching invoice data:", error);
          toast({
            title: "Error",
            description: "Failed to load invoice data",
            variant: "destructive",
          });
        }
      }
    };

    fetchInvoiceData();
  }, [id]);

  const calculateItemAmount = (item: InvoiceItemType) => {
    return item.quantity * item.unitPrice;
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (!invoice) return;

    try {
      // Prepare invoice data for update
      const invoiceData = {
        ...invoice,
        notes,
        terms,
        is_deposit_invoice: isDepositInvoice,
        deposit_amount: depositAmount,
        deposit_percentage: depositPercentage,
        subtotal: items.reduce((sum, item) => sum + item.amount, 0),
        total: isDepositInvoice ? depositAmount : items.reduce((sum, item) => sum + item.amount, 0),
      };

      // Update invoice
      await invoiceService.update(id, invoiceData);

      // Update or create invoice items
      for (const item of items) {
        // Convert back to database format
        const dbItem = {
          id: item.id.toString(),
          invoice_id: id!,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          amount: item.amount,
          category: item.category,
          created_at: "",
          updated_at: ""
        };
        await invoiceService.updateItem(item.id.toString(), dbItem);
      }

      toast({
        title: "Invoice Updated",
        description: "Invoice has been updated successfully.",
      });
      navigate("/invoices");
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const setCustomerId = (customerId: string) => {
    // This function is required by CustomerInfoCard but not used in edit mode
    // since customer is already set and shouldn't change
  };

  if (!invoice || !customer) {
    return <div>Loading...</div>;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Edit Invoice"
        description="Update invoice details and send to customer"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/invoices")}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <CustomerInfoCard 
          customerId={customer.id}
          setCustomer={setCustomerId}
          documentType="invoice"
          documentNumber={invoice.reference_number}
          setDocumentNumber={() => {}} // Read-only in edit mode
          documentDate={invoice.issue_date}
          setDocumentDate={() => {}} // Read-only in edit mode
          expiryDate={invoice.due_date}
          setExpiryDate={() => {}} // Read-only in edit mode
          paymentMethod=""
          setPaymentMethod={() => {}}
          quotationReference={invoice.quotation_ref_number || ""}
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
        
        <WorkPhotosCard
          images={workPhotos}
          onImagesChange={setWorkPhotos}
        />

        <AdditionalInfoCard 
          subject={invoice.subject || undefined}
          terms={terms || undefined}
        />
      </div>
    </div>
  );
}
