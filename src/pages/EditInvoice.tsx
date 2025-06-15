
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Image, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { InvoiceItem } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { InvoiceItemsCard } from "@/components/quotations/InvoiceItemsCard";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { invoiceService, customerService } from "@/services";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateInvoicePDF, downloadPDF } from "@/utils/pdfGenerator";
import { Customer, InvoiceImage } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditInvoice() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();

  const [invoice, setInvoice] = useState<any>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [isDepositInvoice, setIsDepositInvoice] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositPercentage, setDepositPercentage] = useState(30);
  const [quotationReference, setQuotationReference] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<InvoiceImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchInvoice = async () => {
        try {
          const invoiceData = await invoiceService.getById(id);
          setInvoice(invoiceData);
          setCustomerId(invoiceData.customer_id);
          setInvoiceDate(invoiceData.issue_date);
          setDueDate(invoiceData.due_date);
          setNotes(invoiceData.notes || "");
          setSubject(invoiceData.subject || "");
          setIsDepositInvoice(invoiceData.is_deposit_invoice);
          setDepositAmount(invoiceData.deposit_amount);
          setDepositPercentage(invoiceData.deposit_percentage);
          setQuotationReference(invoiceData.quotation_id || "");
          setDocumentNumber(invoiceData.reference_number);
        } catch (error) {
          console.error("Error fetching invoice:", error);
          toast({
            title: "Error",
            description: "Failed to load invoice details. Please try again.",
            variant: "destructive",
          });
        }
      };

      const fetchInvoiceItems = async () => {
        try {
          const itemsData = await invoiceService.getItemsByInvoiceId(id);
          setItems(itemsData.map((item, index) => ({
            id: index + 1,
            description: item.description,
            category: item.category || "Other Items",
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unit_price,
            amount: item.amount
          })));
        } catch (error) {
          console.error("Error fetching invoice items:", error);
          toast({
            title: "Error",
            description: "Failed to load invoice items. Please try again.",
            variant: "destructive",
          });
        }
      };

      const fetchExistingImages = async () => {
        try {
          const existingImagesData = await invoiceService.getInvoiceImages(id);
          setExistingImages(existingImagesData);
        } catch (error) {
          console.error("Error fetching existing images:", error);
        }
      };

      fetchInvoice();
      fetchInvoiceItems();
      fetchExistingImages();
    }
  }, [id]);

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

  const removeExistingImage = async (imageId: string) => {
    try {
      await supabase
        .from('invoice_images')
        .delete()
        .eq('id', imageId);
      
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      
      toast({
        title: "Image Removed",
        description: "Image has been removed from the invoice.",
      });
    } catch (error) {
      console.error("Error removing image:", error);
      toast({
        title: "Error",
        description: "Failed to remove image.",
        variant: "destructive"
      });
    }
  };

  // Function to sanitize file names for storage
  const sanitizeFileName = (fileName: string): string => {
    // Remove or replace problematic characters
    return fileName
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^\w\-_.]/g, '') // Remove special characters except word chars, hyphens, underscores, and dots
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single underscore
      .toLowerCase(); // Convert to lowercase for consistency
  };
  
  const uploadImages = async (invoiceId: string): Promise<boolean> => {
    if (images.length === 0) return true;
    
    console.log("Starting image upload for invoice:", invoiceId);
    console.log("Number of images to upload:", images.length);
    
    setUploadingImages(true);
    
    try {
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        console.log(`Uploading image ${i + 1}/${images.length}:`, file.name);
        
        // Sanitize the file name
        const sanitizedFileName = sanitizeFileName(file.name);
        const fileName = `${invoiceId}/${Date.now()}-${sanitizedFileName}`;
        
        console.log("Sanitized file name:", fileName);
        
        const { data, error } = await supabase.storage
          .from('invoice-images')
          .upload(fileName, file);
        
        if (error) {
          console.error("Error uploading image:", error);
          throw error;
        }
        
        console.log("Image uploaded successfully:", data.path);
        
        const { data: urlData } = supabase.storage
          .from('invoice-images')
          .getPublicUrl(data.path);
        
        console.log("Public URL generated:", urlData.publicUrl);
        
        // Add the image to the database
        const imageRecord = await invoiceService.addInvoiceImage(invoiceId, urlData.publicUrl);
        console.log("Image record saved to database:", imageRecord);
      }
      
      console.log("All images uploaded successfully");
      
      // Clear the uploaded images and URLs
      setImages([]);
      setImageUrls([]);
      
      // Refresh existing images to show the newly uploaded ones
      const updatedImages = await invoiceService.getInvoiceImages(invoiceId);
      setExistingImages(updatedImages);
      
      return true;
    } catch (error) {
      console.error("Error in image upload process:", error);
      toast({
        title: "Upload Error",
        description: "Failed to upload some images. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast({
        title: "Missing Information",
        description: "Please select a customer before updating the invoice.",
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

      const invoiceData = {
        customer_id: customerId,
        reference_number: documentNumber,
        issue_date: invoiceDate,
        due_date: dueDate,
        status: "Draft",
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

      await invoiceService.update(id, invoiceData);

      await invoiceService.deleteItemsByInvoiceId(id);

      for (const item of items) {
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

      // Upload new images if any
      if (images.length > 0) {
        const uploadSuccess = await uploadImages(id!);
        if (!uploadSuccess) {
          toast({
            title: "Partial Success",
            description: "Invoice updated but some images failed to upload.",
            variant: "destructive"
          });
          return;
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

  const downloadInvoicePDF = async (invoice: any, customer: any, items: any[]) => {
    try {
      // Get invoice images from the database
      const invoiceImages: InvoiceImage[] = await invoiceService.getInvoiceImages(invoice.id);
      const imageUrls = invoiceImages.map(img => img.image_url);
      
      const itemsForPDF = items.map(item => ({
        id: Number(item.id),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price || item.unitPrice,
        amount: item.amount,
        category: item.category || '',
        unit: item.unit || ''
      }));
      
      const pdf = generateInvoicePDF({
        documentNumber: invoice.reference_number,
        documentDate: invoice.issue_date,
        customerName: customer.name,
        unitNumber: customer.unit_number || "",
        expiryDate: invoice.due_date,
        dueDate: invoice.due_date,
        notes: invoice.notes || "",
        items: itemsForPDF,
        subject: invoice.subject || "",
        customerAddress: customer.address || "",
        customerContact: customer.phone || "",
        customerEmail: customer.email || "",
        paymentMethod: invoice.payment_method || "bank_transfer",
        isDepositInvoice: invoice.is_deposit_invoice,
        depositAmount: invoice.deposit_amount || 0,
        depositPercentage: invoice.deposit_percentage || 0,
        quotationReference: invoice.quotation_reference || "",
        images: imageUrls
      });
      
      downloadPDF(pdf, `Invoice_${invoice.reference_number}_${customer.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!invoice) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Edit Invoice"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
            <Button variant="default" onClick={() => downloadInvoicePDF(invoice, customer, items)}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
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
                  disabled={uploadingImages}
                >
                  <Image className="mr-2 h-4 w-4" />
                  {uploadingImages ? 'Uploading...' : 'Add Images'}
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
                  {images.length + existingImages.length} {images.length + existingImages.length === 1 ? 'image' : 'images'} total
                </p>
              </div>
              
              {(existingImages.length > 0 || imageUrls.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {existingImages.map((image) => (
                    <div key={image.id} className="relative">
                      <img 
                        src={image.image_url} 
                        alt="Existing invoice image" 
                        className="w-full h-32 object-cover rounded-md" 
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeExistingImage(image.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
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

        <AdditionalInfoCard
          notes={notes}
          setNotes={setNotes}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/invoices")}
          documentType="invoice"
          isSubmitting={isSubmitting || uploadingImages}
        />
      </form>
    </div>
  );
}
