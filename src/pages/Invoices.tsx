
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
  Receipt, 
  MoreHorizontal, 
  Trash,
  Eye,
  Download,
  Send,
  ExternalLink
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

import { invoiceService, customerService } from "@/services";
import { format } from "date-fns";
import { Invoice, Customer } from "@/types/database";
import { generateQuotationPDF, downloadPDF } from "@/utils/pdfGenerator";

interface InvoiceWithCustomer extends Invoice {
  customer_name: string;
  unit_number: string | null;
}

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithCustomer | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceWithCustomer | null>(null);
  
  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await invoiceService.getAll();
      
      // Fetch customer details for each invoice
      const invoicesWithCustomers = await Promise.all(
        data.map(async (invoice) => {
          let customerName = "Unknown";
          let unitNumber = null;
          
          try {
            const customer = await customerService.getById(invoice.customer_id);
            if (customer) {
              customerName = customer.name;
              unitNumber = customer.unit_number;
            }
          } catch (error) {
            console.error(`Error fetching customer for invoice ${invoice.id}:`, error);
          }
          
          return {
            ...invoice,
            customer_name: customerName,
            unit_number: unitNumber
          };
        })
      );
      
      setInvoices(invoicesWithCustomers);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch invoices. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Action handlers
  const handleView = (invoice: InvoiceWithCustomer) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(true);
  };

  const handleEdit = (invoice: InvoiceWithCustomer) => {
    navigate(`/invoices/edit/${invoice.id}`);
  };

  const handleDownload = (invoice: InvoiceWithCustomer) => {
    try {
      // Reusing the quotation PDF generator with invoice data
      const pdf = generateQuotationPDF({
        documentNumber: invoice.reference_number,
        documentDate: invoice.issue_date,
        customerName: invoice.customer_name,
        unitNumber: invoice.unit_number || "",
        expiryDate: invoice.due_date,
        validUntil: invoice.due_date,
        notes: invoice.notes || "",
        items: [], // In real app, we'd need to fetch the items
        subject: "Invoice",
        depositInfo: {
          requiresDeposit: invoice.is_deposit_invoice || false,
          depositAmount: Number(invoice.deposit_amount) || 0,
          depositPercentage: invoice.deposit_percentage || 0
        }
      });
      
      downloadPDF(pdf, `Invoice_${invoice.reference_number}_${invoice.customer_name.replace(/\s+/g, '_')}.pdf`);
      
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

  const handleDelete = (invoice: InvoiceWithCustomer) => {
    setInvoiceToDelete(invoice);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    
    try {
      await invoiceService.delete(invoiceToDelete.id);
      setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete.id));
      setShowDeleteConfirm(false);
      setInvoiceToDelete(null);
      
      toast({
        title: "Invoice Deleted",
        description: `Invoice ${invoiceToDelete.reference_number} has been deleted`,
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = (invoice: InvoiceWithCustomer) => {
    // Update the invoice status to "Paid"
    const updateInvoice = async () => {
      try {
        await invoiceService.update(invoice.id, { payment_status: "Paid" });
        fetchInvoices(); // Refresh the list
        
        toast({
          title: "Payment Recorded",
          description: `Invoice ${invoice.reference_number} has been marked as paid`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error updating invoice:", error);
        toast({
          title: "Error",
          description: "Failed to update invoice. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    updateInvoice();
  };

  const handleSendWhatsapp = (invoice: InvoiceWithCustomer) => {
    if (!invoice.customer_name) {
      toast({
        title: "Missing Information",
        description: "Customer information is required to send WhatsApp message.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch customer details to get phone number
      customerService.getById(invoice.customer_id).then(customer => {
        if (!customer || !customer.phone) {
          toast({
            title: "Missing Phone Number",
            description: "Customer doesn't have a phone number for WhatsApp.",
            variant: "destructive",
          });
          return;
        }
        
        // Format phone number (remove any non-digit characters)
        let phoneNumber = customer.phone.replace(/\D/g, '');
        
        // Make sure phone number starts with country code
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '6' + phoneNumber; // Adding Malaysia country code
        } else if (!phoneNumber.startsWith('6')) {
          phoneNumber = '60' + phoneNumber;
        }
        
        // WhatsApp message text
        const message = `Dear ${invoice.customer_name},\n\nPlease find attached Invoice ${invoice.reference_number}.\n\nThank you.`;
        
        // Open WhatsApp web with the prepared message
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
        
        toast({
          title: "WhatsApp Opened",
          description: "WhatsApp has been opened with the invoice message. The document PDF will need to be attached manually.",
        });
      }).catch(error => {
        console.error("Error fetching customer:", error);
        toast({
          title: "Error",
          description: "Failed to get customer details. Please try again.",
          variant: "destructive",
        });
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

  // Define columns for the DataTable
  const columns: Column<InvoiceWithCustomer>[] = [
    {
      header: "ID",
      accessorKey: "reference_number",
      cell: (invoice) => (
        <button 
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
          onClick={() => handleView(invoice)}
        >
          {invoice.reference_number}
          <ExternalLink className="ml-1 h-3 w-3" />
        </button>
      ),
    },
    {
      header: "Unit #",
      accessorKey: "unit_number",
      cell: (invoice) => invoice.unit_number || "N/A",
    },
    {
      header: "Customer",
      accessorKey: "customer_name",
    },
    {
      header: "Amount",
      accessorKey: "total",
      cell: (invoice) => `RM ${parseFloat(invoice.total.toString()).toFixed(2)}`,
    },
    {
      header: "Issue Date",
      accessorKey: "issue_date",
      cell: (invoice) => format(new Date(invoice.issue_date), "MMM dd, yyyy"),
    },
    {
      header: "Due Date",
      accessorKey: "due_date",
      cell: (invoice) => format(new Date(invoice.due_date), "MMM dd, yyyy"),
    },
    {
      header: "Status",
      accessorKey: "payment_status",
      cell: (invoice) => {
        const status = invoice.payment_status;
        return (
          <Badge className={
            status === "Paid" ? "bg-green-100 text-green-800 hover:bg-green-200" :
            status === "Unpaid" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" :
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
      cell: (invoice) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleView(invoice)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleEdit(invoice)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleDownload(invoice)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleSendWhatsapp(invoice)}
              >
                <Send className="mr-2 h-4 w-4" />
                Send WhatsApp
              </DropdownMenuItem>
              {(invoice.payment_status === "Unpaid" || invoice.payment_status === "Overdue") && (
                <DropdownMenuItem 
                  className="cursor-pointer text-green-600"
                  onClick={() => handleMarkAsPaid(invoice)}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Mark as Paid
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={() => handleDelete(invoice)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Handle closing the view dialog with cleanup
  const closeViewDialog = () => {
    setShowViewDialog(false);
    // Small delay to prevent freezing when closing the dialog
    setTimeout(() => {
      setSelectedInvoice(null);
    }, 100);
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Invoices" 
        description="Manage invoices and track payments."
        actions={
          <Button className="flex items-center" onClick={() => navigate("/invoices/create")}>
            <Receipt className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        }
      />
      
      <div className="mt-8">
        <DataTable 
          columns={columns} 
          data={invoices} 
          searchKey="unit_number" 
          isLoading={isLoading}
        />
      </div>

      {/* View Invoice Dialog */}
      <Dialog open={showViewDialog} onOpenChange={closeViewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice && `Invoice ${selectedInvoice.reference_number}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reference No.</p>
                  <p className="font-medium">{selectedInvoice.reference_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={
                    selectedInvoice.payment_status === "Paid" ? "bg-green-100 text-green-800" :
                    selectedInvoice.payment_status === "Unpaid" ? "bg-amber-100 text-amber-800" :
                    selectedInvoice.payment_status === "Draft" ? "bg-gray-100 text-gray-800" :
                    "bg-red-100 text-red-800"
                  }>
                    {selectedInvoice.payment_status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer</p>
                <p className="font-medium">{selectedInvoice.customer_name}</p>
                {selectedInvoice.unit_number && (
                  <p className="text-sm text-gray-500">Unit #{selectedInvoice.unit_number}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                  <p>{format(new Date(selectedInvoice.issue_date), "MMM dd, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                  <p>{format(new Date(selectedInvoice.due_date), "MMM dd, yyyy")}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p className="text-xl font-semibold">RM {parseFloat(selectedInvoice.total.toString()).toFixed(2)}</p>
                {selectedInvoice.is_deposit_invoice && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-muted-foreground">Deposit Invoice</p>
                    <p>RM {parseFloat(selectedInvoice.deposit_amount?.toString() || "0").toFixed(2)} ({selectedInvoice.deposit_percentage}%)</p>
                  </div>
                )}
              </div>
              
              {selectedInvoice.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm whitespace-pre-line">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={closeViewDialog}>
              Close
            </Button>
            {selectedInvoice && (
              <>
                <Button variant="outline" onClick={() => {
                  closeViewDialog();
                  handleEdit(selectedInvoice);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => {
                  closeViewDialog();
                  handleDownload(selectedInvoice);
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="default" onClick={() => {
                  closeViewDialog();
                  handleSendWhatsapp(selectedInvoice);
                }}>
                  <Send className="mr-2 h-4 w-4" />
                  Send to WhatsApp
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
              This will permanently delete this invoice.
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

      <FloatingActionButton onClick={() => navigate("/invoices/create")} />
    </div>
  );
}
