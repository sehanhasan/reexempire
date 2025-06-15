import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, FileText, Share2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { QuotationItem, DepositInfo } from "@/components/quotations/types";
import { CustomerInfoCard } from "@/components/quotations/CustomerInfoCard";
import { QuotationItemsCard } from "@/components/quotations/QuotationItemsCard";
import { AdditionalInfoCard } from "@/components/quotations/AdditionalInfoCard";
import { quotationService, customerService } from "@/services";
import { Customer, Quotation } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateQuotationPDF, downloadPDF } from "@/utils/pdfGenerator";
import SignatureCanvas from 'react-signature-canvas';

interface ExtendedQuotation extends Quotation {
  subject?: string | null;
  signature_image?: string | null;
  signed_by?: string | null;
  signed_date?: string | null;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export default function ViewQuotation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<QuotationItem[]>([{
    id: 1,
    description: "",
    category: "",
    quantity: 1,
    unit: "Unit",
    unitPrice: 0,
    amount: 0
  }]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotationData, setQuotationData] = useState<ExtendedQuotation | null>(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [status, setStatus] = useState("Draft");
  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    requiresDeposit: false,
    depositAmount: 0,
    depositPercentage: 30
  });
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureCanvas, setSignatureCanvas] = useState<SignatureCanvas | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchQuotationData = async () => {
      try {
        setIsLoading(true);

        const quotation = await quotationService.getById(id) as ExtendedQuotation;
        if (quotation) {
          setQuotationData(quotation);
          setDocumentNumber(quotation.reference_number);
          setStatus(quotation.status);

          setDepositInfo({
            requiresDeposit: quotation.requires_deposit || false,
            depositAmount: quotation.deposit_amount || 0,
            depositPercentage: quotation.deposit_percentage || 30
          });

          if (quotation.customer_id) {
            const customerData = await customerService.getById(quotation.customer_id);
            setCustomer(customerData);
          }

          const quotationItems = await quotationService.getItemsByQuotationId(id);
          if (quotationItems && quotationItems.length > 0) {
            setItems(quotationItems.map(item => ({
              id: item.id,
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
        console.error("Error fetching quotation:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to fetch quotation data. Please try again.",
          variant: "destructive"
        });
        navigate("/quotations");
      }
    };
    fetchQuotationData();
  }, [id, navigate]);

  const handleAcceptQuotation = async (signatureData: string, signedBy: string) => {
    if (!id) return;
    
    try {
      // Update quotation status and save signature
      await quotationService.update(id, {
        status: "Accepted"
      });

      // Save signature data separately - we'll need to extend the service for this
      // For now, we'll update using a more generic approach
      const response = await fetch(`/api/quotations/${id}/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature_image: signatureData,
          signed_by: signedBy,
          signed_date: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save signature');
      }

      setStatus("Accepted");
      
      toast({
        title: "Quotation Accepted",
        description: "The quotation has been accepted and your signature has been saved."
      });
      
    } catch (error) {
      console.error("Error accepting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to accept quotation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRejectQuotation = async () => {
    if (!id) return;
    try {
      await quotationService.update(id, {
        status: "Rejected"
      });
      setStatus("Rejected");
      toast({
        title: "Quotation Rejected",
        description: "The quotation has been rejected."
      });
    } catch (error) {
      console.error("Error rejecting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to reject quotation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleConvertToInvoice = () => {
    navigate("/invoices/create", {
      state: {
        quotationId: id
      }
    });
  };

  const handleSendWhatsapp = () => {
    if (!quotationData || !customer) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const quotationViewUrl = `${window.location.origin}/quotations/view/${id}`;
      
      const whatsappUrl = quotationService.generateWhatsAppShareUrl(
        id!,
        quotationData.reference_number,
        customer.name,
        quotationViewUrl
      );
      
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!quotationData || !customer) return;
    
    try {
      const itemsForPDF = items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) || 1 : item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        category: item.category || '',
        unit: item.unit || ''
      }));
      
      const pdf = generateQuotationPDF({
        documentNumber: documentNumber,
        documentDate: quotationData.issue_date,
        customerName: customer.name,
        unitNumber: customer.unit_number || "",
        expiryDate: quotationData.expiry_date,
        validUntil: quotationData.expiry_date,
        notes: quotationData.notes || "",
        items: itemsForPDF,
        subject: quotationData.subject || "",
        customerAddress: customer.address || "",
        customerContact: customer.phone || "",
        customerEmail: customer.email || "",
        depositInfo: depositInfo,
        signatureImage: quotationData.signature_image || undefined,
        signedBy: quotationData.signed_by || undefined,
        signedDate: quotationData.signed_date ? formatDate(quotationData.signed_date) : undefined
      });
      
      downloadPDF(pdf, `Quotation_${documentNumber}_${customer.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const clearSignature = () => {
    if (signatureCanvas) {
      signatureCanvas.clear();
    }
  };

  const saveSignature = async (signedBy: string) => {
    if (!signatureCanvas) return;
    const signatureData = signatureCanvas.toDataURL();
    
    await handleAcceptQuotation(signatureData, signedBy);
    setShowSignatureModal(false);
  };

  if (isLoading) {
    return <div className="page-container">
        <PageHeader title="View Quotation" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>;
  }

  return <div className="page-container">
      <PageHeader 
        title="View Quotation"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => navigate("/quotations")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quotations
            </Button>
          </div>
        } 
      />

      {status === "Draft" && <div className="rounded-md p-4 mt-4 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h3 className="font-medium">Quotation Status: <span className="text-gray-600">Draft</span></h3>
              <p className="text-sm text-muted-foreground">This quotation is still a draft and has not been sent to the customer</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600" onClick={handleSendWhatsapp}>
                <Share2 className="mr-2 h-4 w-4" />
                Share via WhatsApp
              </Button>
              <Button onClick={() => navigate(`/quotations/edit/${id}`)} className="bg-blue-600 hover:bg-blue-700">
                Edit Quotation
              </Button>
            </div>
          </div>
        </div>}

      {status === "Sent" && <div className="rounded-md p-4 mt-4 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h3 className="font-medium">Quotation Status: <span className="text-amber-600">Sent</span></h3>
              <p className="text-sm text-muted-foreground">This quotation has been sent to the customer</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-red-200 bg-red-50 hover:bg-red-100 text-red-600" onClick={handleRejectQuotation}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Quotation
              </Button>
              <Button variant="outline" className="border-green-200 bg-green-50 hover:bg-green-100 text-green-600" onClick={() => setShowSignatureModal(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Accept Quotation
              </Button>
              <Button variant="outline" className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600" onClick={handleSendWhatsapp}>
                <Share2 className="mr-2 h-4 w-4" />
                Share via WhatsApp
              </Button>
            </div>
          </div>
        </div>}

      {status === "Accepted" && <div className="rounded-md p-4 mt-4 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h3 className="font-medium">Quotation Status: <span className="text-green-600">Accepted</span></h3>
              <p className="text-sm text-muted-foreground">This quotation has been accepted by the customer</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSendWhatsapp} variant="outline" className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600">
                <Share2 className="mr-2 h-4 w-4" />
                Share via WhatsApp
              </Button>
              <Button onClick={handleConvertToInvoice} className="bg-blue-600 hover:bg-blue-700">
                <FileText className="mr-2 h-4 w-4" />
                Convert to Invoice
              </Button>
            </div>
          </div>
        </div>}

      {status === "Rejected" && <div className="rounded-md p-4 mt-4 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h3 className="font-medium">Quotation Status: <span className="text-red-600">Rejected</span></h3>
              <p className="text-sm text-muted-foreground">This quotation has been rejected by the customer</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSendWhatsapp} variant="outline" className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600">
                <Share2 className="mr-2 h-4 w-4" />
                Share via WhatsApp
              </Button>
            </div>
          </div>
        </div>}

      <div className="mt-8 space-y-6">
        <CustomerInfoCard 
          customerId={customer?.id || ""} 
          setCustomer={() => {}}
          documentType="quotation" 
          documentNumber={documentNumber} 
          setDocumentNumber={() => {}}
          documentDate={quotationData?.issue_date || ""} 
          setDocumentDate={() => {}}
          expiryDate={quotationData?.expiry_date || ""} 
          setExpiryDate={() => {}}
          subject={quotationData?.subject || ""} 
          setSubject={() => {}}
          readOnly={true}
        />
        
        <QuotationItemsCard 
          items={items} 
          setItems={() => {}}
          depositInfo={depositInfo} 
          setDepositInfo={() => {}}
          calculateItemAmount={() => 0}
          readOnly={true}
        />
        
        <AdditionalInfoCard 
          notes={quotationData?.notes || ""} 
          setNotes={() => {}}
          onSubmit={() => {}}
          onCancel={() => navigate("/quotations")} 
          documentType="quotation" 
          isSubmitting={false}
          saveButtonText="Update Quotation"
          showDraft={false}
          readOnly={true}
        />
      </div>

      {/* Signature Modal */}
      {showSignatureModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Accept Quotation</h2>
            <p className="text-sm text-muted-foreground mb-4">Please sign below to accept this quotation.</p>
            
            <SignatureCanvas 
              penColor='black'
              backgroundColor='white'
              canvasProps={{width: 500, height: 200, className: 'border rounded-md'}} 
              ref={(canvas) => { setSignatureCanvas(canvas); }}
            />

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowSignatureModal(false)}>Cancel</Button>
              <Button variant="secondary" onClick={clearSignature}>Clear</Button>
              <Button onClick={() => {
                  const signedBy = prompt("Please enter your name:");
                  if (signedBy) {
                    saveSignature(signedBy);
                  }
                }}>
                Save Signature
              </Button>
            </div>
          </div>
        </div>}
    </div>;
}
