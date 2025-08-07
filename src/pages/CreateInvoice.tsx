import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Image, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { InvoiceItem } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { InvoiceItemsCard } from "@/components/quotations/InvoiceItemsCard";
import { AdditionalInfoForm } from "@/components/quotations/AdditionalInfoForm";
import { invoiceService, customerService, quotationService } from "@/services";
import { Customer } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shareInvoice } from "@/utils/mobileShare";

interface ExtendedQuotation {
  id: string;
  customer_id: string;
  reference_number: string;
  requires_deposit?: boolean;
  deposit_amount?: number;
  deposit_percentage?: number;
  subject?: string | null;
  [key: string]: any;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: "", category: "Other Items", quantity: 1, unit: "Unit", unitPrice: 0, amount: 0 }
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
  const [depositPercentage, setDepositPercentage] = useState(30); // Default 30%
  const [quotationReference, setQuotationReference] = useState("");
  const [quotationId, setQuotationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);

  const generateReferenceNumber = async () => {
    const currentYear = new Date().getFullYear();
    try {
      const invoices = await invoiceService.getAll();
      
      const currentYearInvoices = invoices?.filter(inv => 
        inv.reference_number?.startsWith(`INV-${currentYear}`)
      ) || [];
      
      const nextNumber = currentYearInvoices.length + 1;
      return `INV-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating reference number:', error);
      return `INV-${currentYear}-0001`;
    }
  };

  const [documentNumber, setDocumentNumber] = useState("");

  useEffect(() => {
    const initializeReferenceNumber = async () => {
      const refNumber = await generateReferenceNumber();
      setDocumentNumber(refNumber);
    };
    initializeReferenceNumber();
  }, []);

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

  useEffect(() => {
    const fetchQuotationData = async () => {
      const fromQuotationId = location.state?.quotationId;
      
      if (fromQuotationId) {
        try {
          const quotation = await quotationService.getById(fromQuotationId) as ExtendedQuotation;
          if (quotation) {
            setQuotationId(quotation.id);
            setQuotationReference(quotation.reference_number);
            setCustomerId(quotation.customer_id);
            setSubject(quotation.subject || "");
            
            setIsDepositInvoice(quotation.requires_deposit || false);
            setDepositAmount(quotation.deposit_amount || 0);
            setDepositPercentage(quotation.deposit_percentage || 30);
            
            const quotationItems = await quotationService.getItemsByQuotationId(quotation.id);
            if (quotationItems && quotationItems.length > 0) {
              setItems(quotationItems.map((item, index) => ({
                id: index + 1,
                description: item.description,
                category: item.category || "Other Items",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(file => 
        file.type.startsWith('image/')
      );
      
      if (validFiles.length !== filesArray.length) {
        toast({
          title: "Invalid Files",
          description: "Only image files are allowed.",
          variant: "destructive"
        });
      }
      
      const newImageUrls = validFiles.map(file => URL.createObjectURL(file));
      
      setImages(prev => [...prev, ...validFiles]);
      setImageUrls(prev => [...prev, ...newImageUrls]);
    }
  };
  
  const removeImage = (index: number) => {
    URL.revokeObjectURL(imageUrls[index]);
    
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const uploadImages = async (invoiceId: string): Promise<string[]> => {
    if (images.length === 0) return [];
    
    const uploadedUrls: string[] = [];
    setUploadingImages(true);
    
    try {
      for (const file of images) {
        const fileName = `${invoiceId}/${Date.now()}-${file.name}`;
        
        const { data, error } = await supabase.storage
          .from('invoice-images')
          .upload(fileName, file);
        
        if (error) {
          console.error("Error uploading image:", error);
          continue;
        }
        
        const { data: urlData } = supabase.storage
          .from('invoice-images')
          .getPublicUrl(data.path);
        
        uploadedUrls.push(urlData.publicUrl);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error("Error in image upload process:", error);
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handleShare = async () => {
    if (!createdInvoiceId || !customer) {
      toast({
        title: "Error",
        description: "Invoice must be saved before sharing.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await shareInvoice(createdInvoiceId, documentNumber, customer.name);
      toast({
        title: "Share Successful",
        description: "Invoice has been shared successfully.",
      });
    } catch (error) {
      console.error("Error sharing invoice:", error);
      toast({
        title: "Share Failed",
        description: "Failed to share invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: string = "Draft") => {
    e.preventDefault();
    
    if (!customerId) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before creating an invoice.",
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
      
      const invoice = {
        customer_id: customerId,
        quotation_id: quotationId,
        reference_number: documentNumber,
        issue_date: invoiceDate,
        due_date: dueDate,
        status: status,
        subtotal: subtotal,
        tax_rate: 0,
        tax_amount: 0,
        total: total,
        notes: notes || null,
        subject: subject || null,
        terms: null,
        is_deposit_invoice: isDepositInvoice,
        deposit_amount: isDepositInvoice ? depositAmount : 0,
        deposit_percentage: isDepositInvoice ? depositPercentage : 0,
        payment_status: "Unpaid"
      };
      
      const createdInvoice = await invoiceService.create(invoice);
      setCreatedInvoiceId(createdInvoice.id);
      
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
            category: item.category
          });
        }
      }
      
      let uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        uploadedImageUrls = await uploadImages(createdInvoice.id);
        
        if (uploadedImageUrls.length > 0) {
          for (const imageUrl of uploadedImageUrls) {
            await invoiceService.addInvoiceImage(createdInvoice.id, imageUrl);
          }
        }
      }
      
      if (status === "Sent") {
        toast({
          title: "Invoice Sent",
          description: `Invoice for ${customer?.name} has been sent successfully.`,
        });
        
        // Share the invoice after successful creation
        try {
          await shareInvoice(createdInvoice.id, documentNumber, customer.name);
        } catch (error) {
          console.error("Error sharing invoice:", error);
          toast({
            title: "Share Error",
            description: "Invoice saved successfully, but failed to share. You can share it manually from the invoices list.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Invoice Created",
          description: `Invoice for ${customer?.name} has been created successfully.`,
        });
      }
      
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
        
        <Card>
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
            </div>
          </CardContent>
        </Card>
        
        <AdditionalInfoForm 
          onSubmit={handleSubmit}
          onCancel={() => navigate("/invoices")}
          documentType="invoice"
          isSubmitting={isSubmitting || uploadingImages}
          showDraft={true}
          onSendWhatsapp={handleShare}
        />
      </form>
    </div>
  );
}
