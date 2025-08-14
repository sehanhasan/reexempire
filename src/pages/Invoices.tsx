
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { 
  Edit,
  Trash,
  Loader2,
  Send,
  FileText,
  Search,
  MoreHorizontal,
  Download,
  Calendar,
  Clock,
  Home,
  Receipt,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CardContent } from "@/components/ui/card";

import { invoiceService, customerService } from "@/services";
import { formatDate } from "@/utils/formatters";
import { Invoice, Customer } from "@/types/database";
import { useIsMobile } from "@/hooks/use-mobile";

interface InvoiceWithCustomer extends Invoice {
  customer_name: string;
  unit_number?: string;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'Paid':
      return <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-600" />;
    case 'Unpaid':
      return <XCircle className="h-3.5 w-3.5 mr-1 text-red-600" />;
    case 'Partially Paid':
      return <AlertCircle className="h-3.5 w-3.5 mr-1 text-amber-600" />;
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
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoiceData, customerData] = await Promise.all([
        invoiceService.getAll(),
        customerService.getAll()
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
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...invoices];
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => 
        invoice.payment_status.toLowerCase() === statusFilter.toLowerCase()
      );
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
  }, [invoices, searchTerm, statusFilter]);

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
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete the invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendWhatsapp = (invoice: InvoiceWithCustomer) => {
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
      const invoiceViewUrl = `${window.location.origin}/invoices/view/${invoice.id}`;
      const whatsappUrl = invoiceService.generateWhatsAppShareUrl(
        invoice.id, 
        invoice.reference_number, 
        customer.name, 
        invoiceViewUrl
      );
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive",
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

    return () => {
      window.dispatchEvent(new CustomEvent('clear-mobile-search'));
    };
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="p-2">
          <div className="flex items-center justify-center h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading invoices...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-2">
        <PageHeader title="Invoices" />
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <CardContent className="p-0">
            <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search invoices..." 
                  className="pl-10 h-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="w-full sm:w-60">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partially paid">Partially Paid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No invoices found matching your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {isMobile ? (
                  <div className="p-2 space-y-3">
                    {filteredInvoices.map(invoice => {
                      const status = invoice.payment_status;
                      return (
                        <div key={invoice.id} className="bg-white border border-slate-200 rounded-lg shadow-sm border-l-4 border-l-emerald-500" onClick={() => navigate(`/invoices/edit/${invoice.id}`)}>
                          <div className="p-3 border-b bg-emerald-50/30 flex justify-between items-center">
                            <div>
                              <div className="font-medium text-emerald-700">
                                {invoice.unit_number || "-"}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                <Receipt className="h-3 w-3 mr-1" />
                                {invoice.reference_number}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Badge className={`flex items-center ${status === 'Paid' ? 'bg-green-100 text-green-700' : status === 'Unpaid' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
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
                                <Clock className="h-3.5 w-3.5 mr-1.5" />Due Date
                              </span>
                              <span>{formatDate(invoice.due_date)}</span>
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
                            <span className="text-sm font-semibold text-emerald-700">
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
                                  <Trash className="mr-2 h-4 w-4" />
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
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map(invoice => {
                        const status = invoice.payment_status;
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell>
                              <div className="font-medium cursor-pointer text-blue-600" onClick={() => navigate(`/invoices/edit/${invoice.id}`)}>
                                {invoice.reference_number}
                              </div>
                            </TableCell>
                            <TableCell>{invoice.unit_number || "-"}</TableCell>
                            <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                            <TableCell>{formatDate(invoice.due_date)}</TableCell>
                            <TableCell>
                              <Badge className={status === 'Paid' ? 'bg-green-100 text-green-700' : status === 'Unpaid' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                                {status}
                              </Badge>
                            </TableCell>
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
                                    <Trash className="mr-2 h-4 w-4" />
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
          </CardContent>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Delete Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
