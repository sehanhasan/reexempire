
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { FilePlus, Search, MoreHorizontal, FileEdit, Trash2, CheckCircle2, Send, Download } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { invoiceService, customerService } from "@/services";
import { formatDate } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { Invoice, Customer } from "@/types/database";
import { generateInvoicePDF, downloadPDF } from "@/utils/pdfGenerator";

export default function Invoices() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [markAsPaidDialogOpen, setMarkAsPaidDialogOpen] = useState(false);
  const [invoiceToMarkAsPaid, setInvoiceToMarkAsPaid] = useState<Invoice | null>(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch invoices
      const invoiceData = await invoiceService.getAll();
      
      // Check for overdue invoices and update them
      const today = new Date();
      const updatedInvoices = await Promise.all(
        invoiceData.map(async (invoice) => {
          const dueDate = new Date(invoice.due_date);
          if (
            today > dueDate && 
            invoice.payment_status === "Unpaid" &&
            invoice.status !== "Overdue"
          ) {
            // Update to overdue
            const updated = await invoiceService.update(invoice.id, {
              payment_status: "Overdue"
            });
            return updated;
          }
          return invoice;
        })
      );
      
      setInvoices(updatedInvoices);

      // Fetch customers for mapping
      const customerData = await customerService.getAll();
      const customerMap: Record<string, Customer> = {};
      customerData.forEach(customer => {
        customerMap[customer.id] = customer;
      });
      setCustomers(customerMap);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  // Filter invoices based on search term and status filter
  useEffect(() => {
    let filtered = [...invoices];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => invoice.payment_status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.reference_number?.toLowerCase().includes(search) || 
        customers[invoice.customer_id]?.name?.toLowerCase().includes(search) || 
        formatDate(invoice.issue_date)?.toLowerCase().includes(search) ||
        customers[invoice.customer_id]?.unit_number?.toLowerCase().includes(search)
      );
    }
    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter, customers]);
  
  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await invoiceService.delete(invoiceToDelete.id);
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceToDelete.id));
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete the invoice. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleMarkAsPaid = async () => {
    if (!invoiceToMarkAsPaid) return;
    try {
      const updatedInvoice = await invoiceService.update(invoiceToMarkAsPaid.id, {
        payment_status: "Paid"
      });
      
      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceToMarkAsPaid.id ? updatedInvoice : invoice
      ));
      
      setMarkAsPaidDialogOpen(false);
      setInvoiceToMarkAsPaid(null);
      
      toast({
        title: "Payment Recorded",
        description: "The invoice has been marked as paid.",
        variant: "success"
      });
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      toast({
        title: "Error",
        description: "Failed to update the payment status. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleSendWhatsapp = (invoice: Invoice) => {
    const customer = customers[invoice.customer_id];
    
    if (!customer) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format phone number (remove any non-digit characters)
      let phoneNumber = customer.phone?.replace(/\D/g, '') || '';
      
      if (!phoneNumber) {
        toast({
          title: "Missing Phone Number",
          description: "Customer doesn't have a phone number for WhatsApp.",
          variant: "destructive",
        });
        return;
      }
      
      // Make sure phone number starts with country code
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '6' + phoneNumber; // Adding Malaysia country code
      } else if (!phoneNumber.startsWith('6')) {
        phoneNumber = '60' + phoneNumber;
      }
      
      // WhatsApp message text
      const isOverdue = invoice.payment_status === "Overdue";
      const message = isOverdue 
        ? `Dear ${customer.name},\n\nThis is a reminder that invoice ${invoice.reference_number} is now overdue. Please arrange payment as soon as possible.\n\nThank you.\nStar Residences Management`
        : `Dear ${customer.name},\n\nPlease find attached Invoice ${invoice.reference_number} due on ${formatDate(invoice.due_date)}.\n\nThank you.\nStar Residences Management`;
      
      // Open WhatsApp web with the prepared message
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
  
  const handleDownloadPDF = (invoice: Invoice) => {
    const customer = customers[invoice.customer_id];
    
    if (!customer) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdf = generateInvoicePDF({
        documentNumber: invoice.reference_number,
        documentDate: invoice.issue_date,
        customerName: customer.name,
        unitNumber: customer.unit_number || "",
        expiryDate: invoice.due_date,
        dueDate: invoice.due_date,
        paymentMethod: "bank_transfer",
        notes: invoice.notes || "",
        items: [], // We would need to fetch the items for this invoice
        subject: "",
        isDepositInvoice: invoice.is_deposit_invoice || false,
        depositAmount: invoice.deposit_amount || 0,
        depositPercentage: invoice.deposit_percentage || 0,
        quotationReference: ""
      });
      
      downloadPDF(pdf, `Invoice_${invoice.reference_number}_${customer.name.replace(/\s+/g, '_')}.pdf`);
      
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
  
  const columns = [
    {
      header: "Invoice #",
      accessorKey: "reference_number",
      cell: ({ row }: { row: { original: Invoice } }) => (
        <Button 
          variant="link" 
          className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
          onClick={() => navigate(`/invoices/edit/${row.original.id}`)}
        >
          {row.original.reference_number}
        </Button>
      )
    },
    {
      header: "Customer",
      accessorKey: "customer_id",
      cell: ({ row }: { row: { original: Invoice } }) => (
        <div>{customers[row.original.customer_id]?.name || "Unknown"}</div>
      )
    },
    {
      header: "Unit #",
      accessorKey: "unit_number",
      cell: ({ row }: { row: { original: Invoice } }) => (
        <div>{customers[row.original.customer_id]?.unit_number || "-"}</div>
      )
    },
    {
      header: "Date",
      accessorKey: "issue_date",
      cell: ({ row }: { row: { original: Invoice } }) => (
        <div>{formatDate(row.original.issue_date)}</div>
      )
    },
    {
      header: "Due Date",
      accessorKey: "due_date",
      cell: ({ row }: { row: { original: Invoice } }) => (
        <div>{formatDate(row.original.due_date)}</div>
      )
    },
    {
      header: "Status",
      accessorKey: "payment_status",
      cell: ({ row }: { row: { original: Invoice } }) => {
        const status = row.original.payment_status;
        let statusColor = "bg-gray-100 text-gray-800";
        
        if (status === "Paid") {
          statusColor = "bg-green-100 text-green-800";
        } else if (status === "Partially Paid") {
          statusColor = "bg-blue-100 text-blue-800";
        } else if (status === "Overdue") {
          statusColor = "bg-red-100 text-red-800";
        }
        
        return (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {status}
          </div>
        );
      }
    },
    {
      header: "Total",
      accessorKey: "total",
      cell: ({ row }: { row: { original: Invoice } }) => (
        <div className="text-right font-medium">
          RM {Number(row.original.total).toFixed(2)}
        </div>
      )
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: { row: { original: Invoice } }) => (
        <div className="flex justify-end space-x-1">
          {row.original.payment_status !== "Paid" && (
            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8 text-green-600" 
              title="Mark as Paid"
              onClick={() => {
                setInvoiceToMarkAsPaid(row.original);
                setMarkAsPaidDialogOpen(true);
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8" 
            title="Send Reminder"
            onClick={() => handleSendWhatsapp(row.original)}
          >
            <Send className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8" 
            title="Download PDF"
            onClick={() => handleDownloadPDF(row.original)}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/invoices/edit/${row.original.id}`)}>
                <FileEdit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={() => {
                  setInvoiceToDelete(row.original);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Invoices" 
        actions={
          <div className="hidden md:block">
            <Button onClick={() => navigate("/invoices/create")}>
              <FilePlus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        }
      />

      <Card className="mt-6">
        <CardHeader className="pb-2">
          
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                type="search" 
                placeholder="Search invoices..." 
                className="pl-8 h-10" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            
            <div className="w-full md:w-60">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partially paid">Partially Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable 
            columns={columns} 
            data={filteredInvoices} 
            isLoading={loading} 
            emptyMessage="No invoices found. Create your first invoice to get started." 
          />
        </CardContent>
      </Card>

      <FloatingActionButton 
        icon={<FilePlus className="h-5 w-5" />} 
        onClick={() => navigate("/invoices/create")} 
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice{" "}
              <span className="font-medium">
                {invoiceToDelete?.reference_number}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={markAsPaidDialogOpen} onOpenChange={setMarkAsPaidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark invoice{" "}
              <span className="font-medium">
                {invoiceToMarkAsPaid?.reference_number}
              </span>
              {" "}as paid?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkAsPaidDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleMarkAsPaid}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
