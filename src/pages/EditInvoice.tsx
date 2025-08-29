import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, XCircle, Share2, Clock, DollarSign, Image, X, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { QuotationItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoForm } from "@/components/quotations/AdditionalInfoForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { invoiceService, customerService, quotationService } from "@/services";
import { Customer, Invoice, InvoiceImage } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

export default function EditInvoice() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<QuotationItem[]>([{
    id: 1,
    description: "",
    category: "",
    quantity: 1,
    unit: "",
    unitPrice: 0,
    amount: 0
  }]);
  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [subject, setSubject] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [status, setStatus] = useState("Draft");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 50
  });
  const [originalItemOrder, setOriginalItemOrder] = useState<{[key: number]: number}>({});
  
  // Work Photos states (new uploads)
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  // Saved images (already uploaded for this invoice)
const [savedImages, setSavedImages] = useState<InvoiceImage[]>([]);

// Quotation deposit used for Due Invoices
const [quotationDepositAmount, setQuotationDepositAmount] = useState<number | undefined>(undefined);

  // Check if invoice is overdue
  const isOverdue = () => {
    if (!invoiceData || paymentStatus === 'Paid') return false;
    const today = new Date();
    const due = new Date(invoiceData.due_date);
    return today > due;
  };

  // Work Photos handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      // Only accept image files
      const validFiles = fileArray.filter(file => file.type.startsWith('image/'));
      if (validFiles.length !== fileArray.length) {
        toast({
          title: "Invalid Files",
          description: "Only image files are allowed.",
          variant: "destructive"
        });
      }
      setImages(prev => [...prev, ...validFiles]);
      
      // Create URLs for preview
      validFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        setImageUrls(prev => [...prev, url]);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Upload selected images to Supabase Storage and return public URLs
  const uploadImages = async (invoiceId: string): Promise<string[]> => {
    if (images.length === 0) return [];
    
    const uploadedUrls: string[] = [];
    console.log("EditInvoice: Starting image upload for invoice:", invoiceId);

    for (const file of images) {
      // Sanitize filename similar to receipts
      const sanitizedFileName = file.name
        .replace(/\s+/g, '_')
        .replace(/[^\w\-_.]/g, '')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
      const fileName = `${invoiceId}/${Date.now()}-${sanitizedFileName}`;

      const { data, error } = await supabase.storage
        .from('invoice-images')
        .upload(fileName, file);

      if (error) {
        console.error("EditInvoice: Error uploading image:", error);
        toast({
          title: "Upload Error",
          description: `Failed to upload an image: ${error.message}`,
          variant: "destructive"
        });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('invoice-images')
        .getPublicUrl(data.path);

      console.log("EditInvoice: Uploaded image public URL:", urlData.publicUrl);
      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  useEffect(() => {
    if (!id) return;
    const fetchInvoiceData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching invoice data for ID:", id);

        const invoice = await invoiceService.getById(id);
        if (invoice) {
          console.log("Invoice data fetched:", invoice);
          setInvoiceData(invoice);
          setCustomerId(invoice.customer_id);
          setDocumentNumber(invoice.reference_number);
          setInvoiceDate(invoice.issue_date);
          setDueDate(invoice.due_date);
          setNotes(invoice.notes || "");
          setTerms(invoice.terms || "");
          setSubject(invoice.subject || "");
          setStatus(invoice.status);
          setPaymentStatus(invoice.payment_status || "Unpaid");

          // Auto-update status to Overdue if past due date
          if (invoice.payment_status !== 'Paid' && new Date() > new Date(invoice.due_date)) {
            if (invoice.status !== "Overdue") {
              await invoiceService.update(id, { status: "Overdue" });
              setStatus("Overdue");
            }
          }

          // Set deposit info for deposit invoices
          if (invoice.is_deposit_invoice) {
            setDepositInfo({
              requiresDeposit: true,
              depositAmount: invoice.deposit_amount || 0,
              depositPercentage: invoice.deposit_percentage || 50
            });
          } else {
            setDepositInfo({
              requiresDeposit: false,
              depositAmount: 0,
              depositPercentage: 50
            });
          }

          if (invoice.customer_id) {
            const customerData = await customerService.getById(invoice.customer_id);
            setCustomer(customerData);
            console.log("Customer data fetched:", customerData);
          }

          // Fetch quotation deposit for Due Invoice (non-deposit invoice linked to a quotation)
          if (invoice.quotation_id && !invoice.is_deposit_invoice) {
            try {
              const quotation = await quotationService.getById(invoice.quotation_id);
              setQuotationDepositAmount(quotation?.deposit_amount || 0);
            } catch (qErr) {
              console.warn("Failed to fetch quotation for deposit amount", qErr);
            }
          }

          const invoiceItems = await invoiceService.getItemsByInvoiceId(id);
          if (invoiceItems && invoiceItems.length > 0) {
            console.log("Invoice items fetched:", invoiceItems);
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

          // NEW: Fetch saved work photos for this invoice
          try {
            const imgs = await invoiceService.getInvoiceImages(id);
            console.log("EditInvoice: fetched saved images:", imgs?.length || 0);
            setSavedImages(imgs || []);
          } catch (imgErr) {
            console.error("EditInvoice: error fetching saved images:", imgErr);
          }

        } else {
          console.error("Invoice not found");
          toast({
            title: "Error",
            description: "Invoice not found.",
            variant: "destructive"
          });
          navigate("/invoices");
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

  const calculateItemAmount = (item: QuotationItem) => {
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

      const invoice = {
        customer_id: customerId,
        reference_number: documentNumber,
        issue_date: invoiceDate,
        due_date: dueDate,
        status: newStatus || status,
        subtotal: subtotal,
        total: depositInfo.requiresDeposit ? depositInfo.depositAmount : subtotal,
        notes: notes || null,
        terms: terms || null,
        subject: subject || null,
        is_deposit_invoice: depositInfo.requiresDeposit,
        deposit_amount: depositInfo.requiresDeposit ? depositInfo.depositAmount : 0,
        deposit_percentage: depositInfo.requiresDeposit ? Number(depositInfo.depositPercentage) : 0
      };

      await invoiceService.update(id, invoice);

      // Delete existing items and recreate them
      await invoiceService.deleteItemsByInvoiceId(id);

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

      // NEW: Upload work photos and save their URLs to invoice_images
      if (images.length > 0) {
        const uploadedImageUrls = await uploadImages(id);
        if (uploadedImageUrls.length > 0) {
          for (const imageUrl of uploadedImageUrls) {
            await invoiceService.addInvoiceImage(id, imageUrl);
          }
          // Refresh saved images list
          const imgs = await invoiceService.getInvoiceImages(id);
          setSavedImages(imgs || []);
          // Clear local selection
          setImages([]);
          setImageUrls((prev) => {
            prev.forEach((u) => URL.revokeObjectURL(u));
            return [];
          });
        }
      }

      if (newStatus === "Sent") {
        toast({
          title: "Invoice Update Sent",
          description: `Invoice for ${customer?.name} has been updated and sent successfully.`
        });
        
        // Open view page in new tab
        window.open(`/invoices/view/${id}`, '_blank');
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
      const updateData: any = { status: newStatus };
      
      // Update payment status when marking as paid
      if (newStatus === "Paid") {
        // For deposit invoices, set status to "Partial" instead of "Paid"
        if (invoiceData?.is_deposit_invoice) {
          updateData.payment_status = "Partially Paid";
          setPaymentStatus("Partially Paid");
        } else {
          updateData.payment_status = "Paid";
          setPaymentStatus("Paid");
        }
      }
      
      await invoiceService.update(id, updateData);
      setStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Invoice status has been updated to "${newStatus}".`
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendWhatsapp = async (messageType: string = 'general') => {
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
      let message = '';
      
      switch (messageType) {
        case 'overdue':
          message = `Dear ${customer.name},\n\nThis is a friendly reminder that Invoice ${invoiceData.reference_number} is now overdue. Please review and make payment at your earliest convenience:\n\n${invoiceViewUrl}\n\nIf you have any questions, please don't hesitate to contact us.\n\nThank you,\nReex Empire Sdn Bhd`;
          break;
        case 'partial':
          message = `Dear ${customer.name},\n\nWe have received a partial payment for Invoice ${invoiceData.reference_number}. Please review the remaining balance and complete the payment:\n\n${invoiceViewUrl}\n\nThank you for your payment.\n\nReex Empire Sdn Bhd`;
          break;
        case 'paid':
          message = `Dear ${customer.name},\n\nThank you for your payment! Invoice ${invoiceData.reference_number} has been marked as paid. You can view the invoice details here:\n\n${invoiceViewUrl}\n\nWe appreciate your business!\n\nReex Empire Sdn Bhd`;
          break;
        default:
          message = `Dear ${customer.name},\n\nPlease find Invoice ${invoiceData.reference_number} for review:\n\n${invoiceViewUrl}\n\nIf you have any questions, please contact us.\n\nThank you,\nReex Empire Sdn Bhd`;
      }
      
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Error sharing invoice:", error);
      toast({
        title: "Error",
        description: "Failed to share invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const createDueInvoice = async () => {
    if (!invoiceData || !invoiceData.is_deposit_invoice) return;
    
    try {
      const dueInvoice = await invoiceService.createDueInvoiceFromDeposit(invoiceData.id);
      toast({
        title: "Due Invoice Created",
        description: `Due invoice ${dueInvoice.reference_number} has been created successfully.`
      });
      navigate(`/invoices/edit/${dueInvoice.id}`);
    } catch (error) {
      console.error("Error creating due invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create due invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
        <PageHeader title="Edit Invoice" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>;
  }

  return <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      <PageHeader 
        title="Edit Invoice"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => window.open(`/invoices/view/${id}`, '_blank')}>
              <FileText className="mr-2 h-4 w-4" />
              View Invoice
            </Button>
          </div>
        } 
      />

      {(status === "Sent" || status === "Overdue" || status === "Paid" || paymentStatus === "Partial" || paymentStatus === "Partially Paid") && (
        <div className="rounded-md p-4 mt-4 bg-white">
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="font-medium">
                Invoice Status: <span className={
                  status === "Sent" ? "text-amber-600" : 
                  status === "Overdue" ? "text-red-600" : 
                  (paymentStatus === "Partial" || paymentStatus === "Partially Paid") ? "text-blue-600" : 
                  status === "Paid" ? "text-green-600" : "text-gray-600"
                }>
                  {invoiceData?.is_deposit_invoice && status === "Paid" 
                    ? "Paid - Partially" 
                    : (paymentStatus === "Partial" || paymentStatus === "Partially Paid") 
                      ? "Partially Paid" 
                      : status}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground">
                {status === "Sent" && "Update the status of this invoice"}
                {status === "Overdue" && "This invoice is past due. Take action to collect payment."}
                {invoiceData?.is_deposit_invoice && status === "Paid" && "This deposit invoice has been paid."}
                {!invoiceData?.is_deposit_invoice && status === "Paid" && "This invoice has been fully paid."}
                {(paymentStatus === "Partial" || paymentStatus === "Partially Paid") && "(Deposit Paid)"}
              </p>
            </div>
            
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row justify-end'} gap-2`}>
              {/* Actions for Sent status */}
              {status === "Sent" && (
                <>
                  <Button 
                    variant="outline" 
                    className={`${isMobile ? 'w-full' : ''} border-red-200 bg-red-50 hover:bg-red-100 text-red-600`} 
                    onClick={() => handleStatusChange("Overdue")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark as Overdue
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`${isMobile ? 'w-full' : ''} border-green-200 bg-green-50 hover:bg-green-100 text-green-600`} 
                    onClick={() => handleStatusChange("Paid")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                </>
              )}

              {/* Actions for Overdue status */}
              {status === "Overdue" && (
                <>
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
                    onClick={() => setPaymentStatus("Partial")}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Mark as Partial
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`${isMobile ? 'w-full' : ''} border-red-200 bg-red-50 hover:bg-red-100 text-red-600`} 
                    onClick={() => handleSendWhatsapp('overdue')}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Send Reminder
                  </Button>
                </>
              )}

              {/* Actions for Paid status */}
              {status === "Paid" && (
                <>
                  <Button 
                    variant="outline" 
                    className={`${isMobile ? 'w-full' : ''} border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600`} 
                    onClick={() => handleSendWhatsapp('paid')}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Receipt
                  </Button>
                  {invoiceData?.is_deposit_invoice && (
                    <Button 
                      variant="outline" 
                      className={`${isMobile ? 'w-full' : ''} border-green-200 bg-green-50 hover:bg-green-100 text-green-600`} 
                      onClick={createDueInvoice}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Create Due Invoice
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
          quotationReference={invoiceData?.quotation_ref_number || undefined}
        />
        
        <QuotationItemsCard 
          items={items} 
          setItems={setItems} 
          depositInfo={depositInfo} 
          setDepositInfo={setDepositInfo} 
          calculateItemAmount={calculateItemAmount}
          quotationDepositAmount={invoiceData?.quotation_id && !invoiceData?.is_deposit_invoice ? quotationDepositAmount : undefined}
        />
        
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-lg">Work Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="image-upload">Upload images to include in the invoice PDF</Label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Image className="mr-2 h-4 w-4" />
                  Add Images
                </Button>
                <Input 
                  id="image-upload" 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <p className="text-sm text-muted-foreground">
                  {images.length} {images.length === 1 ? 'image' : 'images'} selected
                </p>
              </div>
              
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-md" 
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {savedImages.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Saved Work Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {savedImages.map((img, index) => (
                      <div key={img.id || index} className="relative">
                        <img
                          src={img.image_url}
                          alt={`Saved photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(img.image_url, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card> */}
        
        <AdditionalInfoForm 
          terms={terms}
          setTerms={setTerms}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/invoices")} 
          documentType="invoice" 
          isSubmitting={isSubmitting}
          showDraft={false}
          documentId={id}
          documentNumber={documentNumber}
          customerName={customer?.name}
        />
      </form>
    </div>;
}
