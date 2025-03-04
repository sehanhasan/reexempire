
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { 
  Edit, 
  File, 
  MoreHorizontal, 
  Send,
  Trash,
  Eye,
  Download,
  Receipt,
  RefreshCw
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { quotationService, customerService } from "@/services";
import { format } from "date-fns";
import { Quotation, Customer } from "@/types/database";
import { generateQuotationPDF, downloadPDF } from "@/utils/pdfGenerator";

interface QuotationWithCustomer extends Quotation {
  customer_name: string;
  unit_number: string | null;
}

export default function Quotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<QuotationWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationWithCustomer | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<QuotationWithCustomer | null>(null);
  
  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const data = await quotationService.getAll();
      
      // Fetch customer details for each quotation
      const quotationsWithCustomers = await Promise.all(
        data.map(async (quotation) => {
          let customerName = "Unknown";
          let unitNumber = null;
          
          try {
            const customer = await customerService.getById(quotation.customer_id);
            if (customer) {
              customerName = customer.name;
              unitNumber = customer.unit_number;
            }
          } catch (error) {
            console.error(`Error fetching customer for quotation ${quotation.id}:`, error);
          }
          
          return {
            ...quotation,
            customer_name: customerName,
            unit_number: unitNumber
          };
        })
      );
      
      setQuotations(quotationsWithCustomers);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch quotations. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    fetchQuotations();
  }, []);

  // Action handlers
  const handleView = (quotation: QuotationWithCustomer) => {
    setSelectedQuotation(quotation);
    setShowViewDialog(true);
  };

  const handleEdit = (quotation: QuotationWithCustomer) => {
    navigate(`/quotations/edit/${quotation.id}`);
  };

  const handleDownload = (quotation: QuotationWithCustomer) => {
    try {
      // First fetch the quotation items
      quotationService.getItemsByQuotationId(quotation.id)
        .then(items => {
          const formattedItems = items.map(item => ({
            id: Number(item.id),
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            unitPrice: Number(item.unit_price),
            amount: Number(item.amount)
          }));
          
          const pdf = generateQuotationPDF({
            documentNumber: quotation.reference_number,
            documentDate: quotation.issue_date,
            customerName: quotation.customer_name,
            unitNumber: quotation.unit_number || "",
            expiryDate: quotation.expiry_date,
            validUntil: quotation.expiry_date,
            notes: quotation.notes || "",
            items: formattedItems,
            subject: "Quotation",
            depositInfo: {
              requiresDeposit: quotation.requires_deposit || false,
              depositAmount: Number(quotation.deposit_amount) || 0,
              depositPercentage: quotation.deposit_percentage || 0
            }
          });
          
          downloadPDF(pdf, `Quotation_${quotation.reference_number}_${quotation.customer_name.replace(/\s+/g, '_')}.pdf`);
          
          toast({
            title: "PDF Generated",
            description: "Quotation PDF has been downloaded successfully.",
          });
        })
        .catch(error => {
          console.error("Error fetching quotation items:", error);
          toast({
            title: "PDF Generation Failed",
            description: "There was an error generating the PDF. Please try again.",
            variant: "destructive",
          });
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

  const handleSend = (quotation: QuotationWithCustomer) => {
    // Update the quotation status if it's a draft
    if (quotation.status === "Draft") {
      const updateQuotation = async () => {
        try {
          await quotationService.update(quotation.id, { status: "Sent" });
          fetchQuotations(); // Refresh the list
        } catch (error) {
          console.error("Error updating quotation:", error);
        }
      };
      
      updateQuotation();
    }
    
    sendWhatsappWithQuotation(quotation);
  };

  const sendWhatsappWithQuotation = async (quotation: QuotationWithCustomer) => {
    try {
      // Fetch customer details to get phone number
      const customer = await customerService.getById(quotation.customer_id);
      if (!customer || !customer.phone) {
        toast({
          title: "Missing Phone Number",
          description: "Customer doesn't have a phone number for WhatsApp.",
          variant: "destructive",
        });
        return;
      }

      // Fetch quotation items
      const items = await quotationService.getItemsByQuotationId(quotation.id);
      
      const formattedItems = items.map(item => ({
        id: Number(item.id),
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unit_price),
        amount: Number(item.amount)
      }));
      
      // Generate PDF
      const pdf = generateQuotationPDF({
        documentNumber: quotation.reference_number,
        documentDate: quotation.issue_date,
        customerName: quotation.customer_name,
        unitNumber: quotation.unit_number || "",
        expiryDate: quotation.expiry_date,
        validUntil: quotation.expiry_date,
        notes: quotation.notes || "",
        items: formattedItems,
        subject: "Quotation",
        depositInfo: {
          requiresDeposit: quotation.requires_deposit || false,
          depositAmount: Number(quotation.deposit_amount) || 0,
          depositPercentage: quotation.deposit_percentage || 0
        }
      });
      
      // Use the Base64 PDF to create a Data URL
      const pdfDataUri = pdf.output('datauristring');
      
      // Format phone number (remove any non-digit characters)
      let phoneNumber = customer.phone.replace(/\D/g, '');
      
      // Make sure phone number starts with country code
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '6' + phoneNumber; // Adding Malaysia country code
      } else if (!phoneNumber.startsWith('6')) {
        phoneNumber = '60' + phoneNumber;
      }
      
      // WhatsApp message text
      const message = `Dear ${quotation.customer_name},\n\nPlease find attached Quotation ${quotation.reference_number}.\n\nThank you.`;
      
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

  const handleDelete = (quotation: QuotationWithCustomer) => {
    setQuotationToDelete(quotation);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!quotationToDelete) return;
    
    try {
      await quotationService.delete(quotationToDelete.id);
      setQuotations(quotations.filter(q => q.id !== quotationToDelete.id));
      setShowDeleteConfirm(false);
      setQuotationToDelete(null);
      
      toast({
        title: "Quotation Deleted",
        description: `Quotation ${quotationToDelete.reference_number} has been deleted`,
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to delete quotation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsAccepted = (quotation: QuotationWithCustomer) => {
    const updateQuotation = async () => {
      try {
        await quotationService.update(quotation.id, { status: "Accepted" });
        fetchQuotations(); // Refresh the list
        
        toast({
          title: "Quotation Accepted",
          description: `Quotation ${quotation.reference_number} has been marked as accepted`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error updating quotation:", error);
        toast({
          title: "Error",
          description: "Failed to update quotation. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    updateQuotation();
  };

  const handleMarkAsRejected = (quotation: QuotationWithCustomer) => {
    const updateQuotation = async () => {
      try {
        await quotationService.update(quotation.id, { status: "Rejected" });
        fetchQuotations(); // Refresh the list
        
        toast({
          title: "Quotation Rejected",
          description: `Quotation ${quotation.reference_number} has been marked as rejected`,
          variant: "destructive",
        });
      } catch (error) {
        console.error("Error updating quotation:", error);
        toast({
          title: "Error",
          description: "Failed to update quotation. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    updateQuotation();
  };

  const handleConvertToInvoice = (quotation: QuotationWithCustomer) => {
    navigate("/invoices/create", { state: { quotationId: quotation.id } });
  };

  // Define columns for the DataTable
  const columns: Column<QuotationWithCustomer>[] = [
    {
      header: "ID",
      accessorKey: "reference_number",
      cell: (quotation) => (
        <button 
          className="font-medium text-blue-600 hover:underline"
          onClick={() => handleView(quotation)}
        >
          {quotation.reference_number}
        </button>
      ),
    },
    {
      header: "Unit #",
      accessorKey: "unit_number",
      cell: (quotation) => quotation.unit_number || "N/A",
    },
    {
      header: "Customer",
      accessorKey: "customer_name",
    },
    {
      header: "Amount",
      accessorKey: "total",
      cell: (quotation) => `RM ${parseFloat(quotation.total.toString()).toFixed(2)}`,
    },
    {
      header: "Issue Date",
      accessorKey: "issue_date",
      cell: (quotation) => format(new Date(quotation.issue_date), "MMM dd, yyyy"),
    },
    {
      header: "Valid Until",
      accessorKey: "expiry_date",
      cell: (quotation) => format(new Date(quotation.expiry_date), "MMM dd, yyyy"),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (quotation) => {
        const status = quotation.status;
        return (
          <Badge className={
            status === "Accepted" ? "bg-green-100 text-green-800 hover:bg-green-200" :
            status === "Sent" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" :
            status === "Draft" ? "bg-gray-100 text-gray-800 hover:bg-gray-200" :
            "bg-red-100 text-red-800 hover:bg-red-200"
          }>
            {status}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id", // We need to specify a key even for action columns
      cell: (quotation) => {
        return (
          <div className="flex items-center">
            {(quotation.status === "Draft" || quotation.status === "Accepted") && (
              <Button variant="ghost" size="icon" onClick={() => handleEdit(quotation)} title="Edit">
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleView(quotation)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                {quotation.status === "Draft" && (
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleEdit(quotation)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleDownload(quotation)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                {quotation.status === "Draft" && (
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => handleSend(quotation)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </DropdownMenuItem>
                )}
                {quotation.status === "Sent" && (
                  <>
                    <DropdownMenuItem 
                      className="cursor-pointer text-green-600"
                      onClick={() => handleMarkAsAccepted(quotation)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Mark as Accepted
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer text-red-600"
                      onClick={() => handleMarkAsRejected(quotation)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Mark as Rejected
                    </DropdownMenuItem>
                  </>
                )}
                {quotation.status === "Accepted" && (
                  <DropdownMenuItem 
                    className="cursor-pointer text-blue-600"
                    onClick={() => handleConvertToInvoice(quotation)}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    Convert to Invoice
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600"
                  onClick={() => handleDelete(quotation)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Quotations" 
        description="Manage quotations and track their status."
        actions={
          <Button className="flex items-center" onClick={() => navigate("/quotations/create")}>
            <File className="mr-2 h-4 w-4" />
            Create Quotation
          </Button>
        }
      />
      
      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={quotations} 
          searchKey="unit_number" 
          isLoading={isLoading}
        />
      </div>

      {/* View Quotation Dialog */}
      <Dialog open={showViewDialog} onOpenChange={(open) => {
        setShowViewDialog(open);
        // Make sure to clear the selected quotation when closing to prevent freezing
        if (!open) {
          setTimeout(() => setSelectedQuotation(null), 300);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
            <DialogDescription>
              {selectedQuotation && `Quotation ${selectedQuotation.reference_number}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reference No.</p>
                  <p className="font-medium">{selectedQuotation.reference_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={
                    selectedQuotation.status === "Accepted" ? "bg-green-100 text-green-800" :
                    selectedQuotation.status === "Sent" ? "bg-amber-100 text-amber-800" :
                    selectedQuotation.status === "Draft" ? "bg-gray-100 text-gray-800" :
                    "bg-red-100 text-red-800"
                  }>
                    {selectedQuotation.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer</p>
                <p className="font-medium">{selectedQuotation.customer_name}</p>
                {selectedQuotation.unit_number && (
                  <p className="text-sm text-gray-500">Unit #{selectedQuotation.unit_number}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                  <p>{format(new Date(selectedQuotation.issue_date), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valid Until</p>
                  <p>{format(new Date(selectedQuotation.expiry_date), "MMM dd, yyyy")}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p className="text-xl font-semibold">RM {parseFloat(selectedQuotation.total.toString()).toFixed(2)}</p>
                {selectedQuotation.requires_deposit && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-muted-foreground">Deposit Required</p>
                    <p>RM {parseFloat(selectedQuotation.deposit_amount?.toString() || "0").toFixed(2)} ({selectedQuotation.deposit_percentage}%)</p>
                  </div>
                )}
              </div>
              
              {selectedQuotation.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm whitespace-pre-line">{selectedQuotation.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {selectedQuotation && selectedQuotation.status === "Draft" && (
              <Button variant="outline" onClick={() => {
                setShowViewDialog(false);
                handleEdit(selectedQuotation);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {selectedQuotation && (
              <>
                <Button variant="outline" onClick={() => {
                  setShowViewDialog(false);
                  handleDownload(selectedQuotation);
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowViewDialog(false);
                  handleSend(selectedQuotation);
                }}>
                  <Send className="mr-2 h-4 w-4" />
                  Send via WhatsApp
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this quotation.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FloatingActionButton onClick={() => navigate("/quotations/create")} />
    </div>
  );
}
