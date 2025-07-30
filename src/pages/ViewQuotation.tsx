
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Download, Check, Share2 } from "lucide-react";
import { quotationService, customerService } from "@/services";
import { Customer, Quotation, QuotationItem as QuotationItemType } from "@/types/database";
import { formatDate } from "@/utils/formatters";
import { generateQuotationPDF, downloadPDF } from "@/utils/pdfGenerator";
import { captureViewAsPDF } from "@/utils/htmlToPdf";
import SignatureCanvas from "react-signature-canvas";
import { Separator } from "@/components/ui/separator";

export default function ViewQuotation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<QuotationItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [signatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [sigPad, setSigPad] = useState<SignatureCanvas | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signerInfo, setSignerInfo] = useState<{ name: string; date: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchQuotationData = async () => {
      try {
        setLoading(true);
        
        console.log("Fetching quotation data for ID:", id);
        const quotationData = await quotationService.getById(id);
        console.log("Quotation data received:", quotationData);
        
        if (quotationData) {
          setQuotation(quotationData);
          
          // Parse signature data and signer info from notes if it exists
          if (quotationData.notes && quotationData.notes.includes('SIGNATURE_DATA:')) {
            const signaturePart = quotationData.notes.split('SIGNATURE_DATA:')[1];
            if (signaturePart) {
              const parts = signaturePart.split('SIGNER_INFO:');
              if (parts.length === 2) {
                setSignatureData(parts[0].trim());
                const signerInfoStr = parts[1].trim();
                try {
                  const parsedSignerInfo = JSON.parse(signerInfoStr);
                  setSignerInfo(parsedSignerInfo);
                } catch (e) {
                  console.error("Error parsing signer info:", e);
                }
              }
            }
          }
          
          if (quotationData.customer_id) {
            console.log("Fetching customer data for ID:", quotationData.customer_id);
            const customerData = await customerService.getById(quotationData.customer_id);
            console.log("Customer data received:", customerData);
            setCustomer(customerData);
            setCustomerName(customerData?.name || "");
          }
          
          console.log("Fetching items for quotation ID:", id);
          const itemsData = await quotationService.getItemsByQuotationId(id);
          console.log("Items data received:", itemsData);
          setItems(itemsData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching quotation:", error);
        setLoading(false);
        toast({
          title: "Error",
          description: "Could not load quotation details. Please try again later.",
          variant: "destructive"
        });
      }
    };
    
    fetchQuotationData();
  }, [id]);

  const handleSignature = async () => {
    if (!sigPad || sigPad.isEmpty()) {
      toast({
        title: "Signature Required",
        description: "Please sign the quotation to accept it.",
        variant: "destructive"
      });
      return;
    }

    if (!customerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Starting signature processing...");
      
      // Convert signature to data URL
      const signatureDataUrl = sigPad.toDataURL('image/png');
      const signerDetails = {
        name: customerName,
        date: signatureDate
      };
      
      console.log("Signature data URL length:", signatureDataUrl.length);
      console.log("Signer details:", signerDetails);
      
      // Update quotation status to Accepted and store signature data
      if (id && quotation) {
        const originalNotes = quotation.notes || "";
        const cleanNotes = originalNotes.split('SIGNATURE_DATA:')[0].trim();
        const notesWithSignature = `${cleanNotes}\n\nSIGNATURE_DATA:${signatureDataUrl}\nSIGNER_INFO:${JSON.stringify(signerDetails)}`;
        
        console.log("Updating quotation with ID:", id);
        console.log("Update payload:", {
          status: "Accepted",
          notes: notesWithSignature.substring(0, 100) + "..." // Log first 100 chars only
        });
        
        try {
          const updatedQuotation = await quotationService.update(id, {
            status: "Accepted",
            notes: notesWithSignature
          });
          
          console.log("Quotation updated successfully:", updatedQuotation);
          
          toast({
            title: "Quotation Accepted",
            description: "Thank you! The quotation has been accepted successfully."
          });
          
          setIsSigned(true);
          setSignatureData(signatureDataUrl);
          setSignerInfo(signerDetails);
          setQuotation(updatedQuotation);
          
        } catch (updateError) {
          console.error("Error updating quotation:", updateError);
          console.error("Error details:", JSON.stringify(updateError, null, 2));
          
          // More specific error handling
          let errorMessage = "Failed to update quotation status. Please try again.";
          if (updateError instanceof Error) {
            errorMessage = `Update failed: ${updateError.message}`;
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive"
          });
        }
      } else {
        console.error("Missing required data - ID:", id, "Quotation:", quotation);
        toast({
          title: "Error",
          description: "Missing quotation information. Please refresh and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error processing signature:", error);
      toast({
        title: "Error",
        description: "Failed to process signature. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSignature = () => {
    if (sigPad) {
      sigPad.clear();
    }
  };

  const handleDownloadPDF = async () => {
    if (!quotation || !customer) return;
    
    try {
      // Hide the sticky header and print buttons before capturing
      const stickyHeader = document.querySelector('.sticky') as HTMLElement;
      const downloadButton = document.querySelector('.print\\:hidden') as HTMLElement;
      
      if (stickyHeader) stickyHeader.style.display = 'none';
      if (downloadButton) downloadButton.style.display = 'none';
      
      // Capture the view as PDF
      await captureViewAsPDF(
        'quotation-content',
        `Quotation_${quotation.reference_number}_${customer.name.replace(/\s+/g, '_')}.pdf`,
        {
          scale: 2,
          backgroundColor: '#f9fafb'
        }
      );
      
      // Restore the hidden elements
      if (stickyHeader) stickyHeader.style.display = '';
      if (downloadButton) downloadButton.style.display = '';
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
      
      // Restore the hidden elements in case of error
      const stickyHeader = document.querySelector('.sticky') as HTMLElement;
      const downloadButton = document.querySelector('.print\\:hidden') as HTMLElement;
      if (stickyHeader) stickyHeader.style.display = '';
      if (downloadButton) downloadButton.style.display = '';
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const formatMoney = (amount: number) => {
    return `RM ${parseFloat(amount.toString()).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotation details...</p>
        </div>
      </div>
    );
  }

  if (!quotation || !customer) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quotation Not Found</h2>
          <p className="text-gray-600 mb-6">The requested quotation could not be found or has expired.</p>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  // Group items by category
  const groupedItems: Record<string, QuotationItemType[]> = {};
  items.forEach(item => {
    const category = item.category || "Other Items";
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });
  
  const categories = Object.keys(groupedItems).sort();
  
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

  // Clean notes (remove signature data for display)
  const displayNotes = quotation.notes ? quotation.notes.split('SIGNATURE_DATA:')[0].trim() : null;

  return (
    <div className="min-h-screen bg-gray-50" style={{ minWidth: '1024px' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="https://i.ibb.co/Ltyts5K/reex-empire-logo.png" 
                alt="Reex Empire Logo" 
                className="h-10 w-auto"
              />
            </div>
            <div className="text-center flex-1 px-4">
              <h1 className="text-lg font-bold text-blue-800">Quotation #{quotation.reference_number}</h1>
              <p className="text-sm text-gray-600">
                Issued: {formatDate(quotation.issue_date)} | Valid until: {formatDate(quotation.expiry_date)}
              </p>
            </div>
            <div className="flex items-center">
              <Button variant="outline" onClick={handleDownloadPDF} className="flex items-center gap-1">
                <Download size={18} />
                <span>Download PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8 px-4">
        <div id="quotation-content" className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">From</h3>
                  <div className="text-gray-700">
                    <p className="font-medium">Reex Empire Sdn Bhd (1426553-A)</p>
                    <p>No. 29-1, Jalan 2A/6</p>
                    <p>Taman Setapak Indah</p>
                    <p>53300 Setapak Kuala Lumpur</p>
                    <p>www.reexempire.com</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">To</h3>
                  <div className="text-gray-700">
                    <p className="font-medium">{customer.name}</p>
                    {customer.unit_number && <p>Unit {customer.unit_number}</p>}
                    {customer.address && <p>{customer.address}</p>}
                    {customer.city && <p>{customer.city}, {customer.state} {customer.postal_code}</p>}
                    {customer.phone && <p>Phone: {customer.phone}</p>}
                    {customer.email && <p>Email: {customer.email}</p>}
                  </div>
                </div>
              </div>
              
              {quotation.subject && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-semibold text-gray-700 mb-2">Subject</h3>
                  <p>{quotation.subject}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Items</h3>
              
              {/* Main table header */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="py-2 px-4 border-b">Description</th>
                      <th className="py-2 px-4 border-b text-right">Price</th>
                      <th className="py-2 px-4 border-b text-right">Qty</th>
                      <th className="py-2 px-4 border-b text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map(category => (
                      <>
                        <tr key={category}>
                          <td colSpan={4} className="py-2 px-4 font-medium text-blue-800 bg-blue-50">
                            {category}
                          </td>
                        </tr>
                        {groupedItems[category].map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-3 px-4">{item.description}</td>
                            <td className="py-3 px-4 text-right">{formatMoney(item.unit_price)}</td>
                            <td className="py-3 px-4 text-right">{item.quantity}</td>
                            <td className="py-3 px-4 text-right">{formatMoney(item.amount)}</td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-xs">
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  {quotation.requires_deposit && (
                    <>
                      <div className="flex justify-between py-2">
                        <span className="font-medium">Deposit Required ({quotation.deposit_percentage}%):</span>
                        <span>{formatMoney(quotation.deposit_amount || 0)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatMoney(quotation.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card - only show if there are actual notes (not signature data) */}
          {displayNotes && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
                <p className="whitespace-pre-line">{displayNotes}</p>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Terms and Conditions</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Payment terms 30 days</li>
                <li>Project duration 5-7 working days</li>
                <li>This quotation is valid until {formatDate(quotation.expiry_date)}</li>
              </ul>
              
              {/* Display signature data if quotation is signed */}
              {signatureData && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-semibold text-gray-700 mb-3">Electronic Signature</h4>
                  <div className="border border-gray-300 rounded-md p-4 bg-white inline-block">
                    <img 
                      src={signatureData} 
                      alt="Electronic Signature" 
                      className="max-w-md h-auto"
                      style={{ maxHeight: '120px' }}
                    />
                  </div>
                  {signerInfo && (
                    <p className="mt-2 text-sm text-gray-600">
                      Electronically signed by: <strong>{signerInfo.name}</strong> on <strong>{formatDate(signerInfo.date)}</strong>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {quotation.status !== "Accepted" && !isSigned ? (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Accept Quotation</h3>
                <p className="mb-4">To accept this quotation, please fill out the information below:</p>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <Input 
                      id="customerName" 
                      value={customerName} 
                      onChange={(e) => setCustomerName(e.target.value)} 
                      placeholder="Your full name" 
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="signatureDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <Input 
                      id="signatureDate" 
                      value={formatDate(signatureDate)} 
                      readOnly 
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signature
                  </label>
                  <div className="border border-gray-300 rounded-md p-2 bg-white">
                    <SignatureCanvas 
                      ref={(ref) => setSigPad(ref)} 
                      penColor="black"
                      canvasProps={{
                        width: 500,
                        height: 200,
                        className: "w-full signature-canvas",
                        style: { 
                          touchAction: 'none',
                          cursor: 'crosshair',
                          width: '100%',
                          height: '200px'
                        }
                      }}
                      backgroundColor="white"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button onClick={clearSignature} variant="outline" type="button">
                    Clear
                  </Button>
                  <Button 
                    onClick={handleSignature} 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Processing..." : "Accept Quotation"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : isSigned || quotation.status === "Accepted" ? (
            <Card className="mb-6 bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center text-green-700 mb-4">
                  <Check className="mr-2 h-5 w-5" />
                  <h3 className="font-semibold">Quotation Accepted</h3>
                </div>
                <p className="text-green-700 mb-4">
                  Thank you for accepting this quotation. We will be in touch shortly to proceed with the next steps.
                </p>
                
                {/* Display actual signature */}
                {signatureData && (
                  <div className="mt-4">
                    <div className="border border-gray-300 rounded-md p-4 bg-white inline-block">
                      <img 
                        src={signatureData} 
                        alt="Electronic Signature" 
                        className="max-w-md h-auto"
                        style={{ maxHeight: '150px' }}
                      />
                    </div>
                    {signerInfo && (
                      <p className="mt-2 text-sm text-gray-600">
                        Electronically signed by: <strong>{signerInfo.name}</strong> on <strong>{formatDate(signerInfo.date)}</strong>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          <div className="text-center text-gray-500 text-sm mt-8">
            <p>Thank you for your business!</p>
            <p>&copy; {new Date().getFullYear()} Reex Empire Sdn Bhd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
