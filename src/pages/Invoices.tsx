
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { FilePlus, Search, MoreHorizontal, FileEdit, Trash2, FileText, Download, Send, Calendar, Clock, Home, AlertCircle, CheckCircle2, XCircle, TimerReset, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { invoiceService, customerService } from "@/services";
import { formatDate } from "@/utils/formatters";
import { Invoice, Customer } from "@/types/database";
import { generateInvoicePDF, downloadPDF } from "@/utils/pdfGenerator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface InvoiceWithCustomer extends Invoice {
  customer_name: string;
  unit_number?: string;
}

const StatusBadge = ({
  status
}: {
  status: string;
}) => {
  let bgColor, textColor;
  switch (status) {
    case 'Draft':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-700';
      break;
    case 'Sent':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-700';
      break;
    case 'Paid':
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
      break;
    case 'Overdue':
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      break;
    case 'Partial':
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-700';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-700';
  }
  return <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${bgColor} ${textColor}`}>
      {status}
    </span>;
};

const StatusIcon = ({
  status
}: {
  status: string;
}) => {
  switch (status) {
    case 'Draft':
      return <AlertCircle className="h-3.5 w-3.5 mr-1 text-gray-500" />;
    case 'Sent':
      return <Send className="h-3.5 w-3.5 mr-1 text-blue-600" />;
    case 'Paid':
      return <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-600" />;
    case 'Overdue':
      return <XCircle className="h-3.5 w-3.5 mr-1 text-red-600" />;
    case 'Partial':
      return <TimerReset className="h-3.5 w-3.5 mr-1 text-amber-600" />;
    default:
      return <AlertCircle className="h-3.5 w-3.5 mr-1 text-gray-500" />;
  }
};

export default function Invoices() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoiceData, customerData] = await Promise.all([
        invoiceService.getAll(),
        customerService.getAll(),
      ]);

      const customerMap: Record<string, Customer> = {};
      customerData.forEach(customer => {
        customerMap[customer.id] = customer;
      });
      setCustomers(customerMap);

      const enhancedInvoices: InvoiceWithCustomer[] = invoiceData.map(invoice => ({
        ...invoice,
        customer_name: customerMap[invoice.customer_id]?.name || "Unknown Customer",
        unit_number: customerMap[invoice.customer_id]?.unit_number
      }));
      setInvoices(enhancedInvoices);
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

  useEffect(() => {
    let filtered = [...invoices];

    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => invoice.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(invoice => invoice.payment_status.toLowerCase() === paymentStatusFilter.toLowerCase());
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.reference_number.toLowerCase().includes(search) ||
        invoice.customer_name.toLowerCase().includes(search) ||
        formatDate(invoice.issue_date).toLowerCase().includes(search) ||
        (invoice.unit_number && invoice.unit_number.toLowerCase().includes(search))
      );
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter, paymentStatusFilter]);

  const handleDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      await invoiceService.delete(invoiceToDelete.id);
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceToDelete.id));
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been deleted successfully.",
        variant: "destructive"
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

  const handleSendWhatsapp = (invoice: InvoiceWithCustomer) => {
    const customer = customers[invoice.customer_id];
    if (!customer) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive"
      });
      return;
    }

    try {
      const invoiceViewUrl = `${window.location.origin}/invoices/view/${invoice.id}`;
      const whatsappUrl = invoiceService.generateWhatsAppShareUrl(invoice.id, invoice.reference_number, customer.name, invoiceViewUrl);
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = async (invoice: InvoiceWithCustomer) => {
    const customer = customers[invoice.customer_id];
    if (!customer) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive"
      });
      return;
    }

    try {
      const invoiceItems = await invoiceService.getItemsByInvoiceId(invoice.id);
      const itemsForPDF = invoiceItems.map(item => ({
        id: Number(item.id),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: item.amount,
        category: item.category || '',
        unit: item.unit || ''
      }));

      const pdf = generateInvoicePDF({
        documentNumber: invoice.reference_number,
        documentDate: invoice.issue_date,
        dueDate: invoice.due_date,
        paymentMethod: 'bank_transfer',
        isDepositInvoice: invoice.is_deposit_invoice,
        depositAmount: invoice.deposit_amount,
        depositPercentage: invoice.deposit_percentage,
        customerName: customer.name,
        unitNumber: customer.unit_number || "",
        items: itemsForPDF,
        subject: invoice.subject || "",
        customerAddress: customer.address || "",
        customerContact: customer.phone || "",
        customerEmail: customer.email || "",
        notes: invoice.notes || "",
        expiryDate: invoice.due_date,
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

  const formatMoney = (amount: number) => {
    return `RM ${parseFloat(amount.toString()).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Set up mobile search
  useEffect(() => {
    const mobileSearchEvent = new CustomEvent('setup-mobile-search', {
      detail: {
        searchTerm,
        onSearchChange: setSearchTerm,
        placeholder: "Search invoices..."
      }
    });
    window.dispatchEvent(mobileSearchEvent);

    // Clear search when leaving the page
    return () => {
      window.dispatchEvent(new CustomEvent('clear-mobile-search'));
    };
  }, [searchTerm]);

  return (
    <div className="page-container">
      <PageHeader title="Invoices" actions={<div className="hidden md:block"></div>} />

      <div className="mt-1">
        <div className="p-0">
          <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search invoices..."
                className="pl-10 h-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-60">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-60">
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center bg-slate-100">
              <p className="text-muted-foreground">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No invoices found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {isMobile ? (
                <div className="p-2 space-y-3">
                  {filteredInvoices.map(invoice => {
                    const status = invoice.status;
                    return (
                      <div
                        key={invoice.id}
                        className="mobile-card border-l-4 border-l-blue-500 rounded-md shadow-sm"
                        onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                      >
                        <div className="p-3 border-b bg-blue-50/30 flex justify-between items-center">
                          <div>
                            <div className="font-medium text-blue-700">
                              {invoice.unit_number || "-"}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                              <FileText className="h-3 w-3 mr-1" />
                              {invoice.reference_number}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge className={`flex items-center ${status === 'Paid' ? 'bg-green-100 text-green-700' : status === 'Sent' ? 'bg-blue-100 text-blue-700' : status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                              <StatusIcon status={status} />
                              {status}
                            </Badge>
                          </div>
                        </div>

                        <div className="px-3 py-2 space-y-1.5">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5" />Issue Date
                            </span>
                            <span className="text-inherit">{formatDate(invoice.issue_date)}</span>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5" />Payment Status
                            </span>
                            <span>{invoice.payment_status}</span>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center">
                              <Home className="h-3.5 w-3.5 mr-1.5" />Customer
                            </span>
                            <span className="font-medium truncate max-w-[150px]">
                              {invoice.customer_name}
                            </span>
                          </div>
                        </div>

                        <div className="border-t p-2 bg-gray-50 flex justify-between items-center">
                          <span className="text-sm font-semibold text-blue-700">
                            {formatMoney(invoice.total)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={e => {
                                e.stopPropagation();
                                handleSendWhatsapp(invoice);
                              }}>
                                <Send className="mr-2 h-4 w-4" />
                                Send via WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={e => {
                                e.stopPropagation();
                                setInvoiceToDelete(invoice);
                                setDeleteDialogOpen(true);
                              }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Unit #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map(invoice => {
                      const status = invoice.status;
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div className="font-medium cursor-pointer text-blue-600" onClick={() => navigate(`/invoices/edit/${invoice.id}`)}>
                              {invoice.reference_number}
                            </div>
                          </TableCell>
                          <TableCell>{invoice.unit_number || "-"}</TableCell>
                          <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                          <TableCell>
                            <StatusBadge status={status} />
                          </TableCell>
                          <TableCell>{invoice.payment_status}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMoney(invoice.total)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSendWhatsapp(invoice)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send via WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => {
                                  setInvoiceToDelete(invoice);
                                  setDeleteDialogOpen(true);
                                }}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </div>

      <FloatingActionButton onClick={() => navigate("/invoices/create")} />

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
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0">
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
    </div>
  );
}
