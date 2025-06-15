import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Eye, Edit, MoreHorizontal, CalendarClock, Download, Plus, Search, Check, Send, AlertTriangle, FileText, Clock, Calendar, CircleDollarSign, Home, Trash2, FileOutput } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { invoiceService, customerService, exportService } from "@/services";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredData, setFilteredData] = useState([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [invoicesData, customersData] = await Promise.all([invoiceService.getAll(), customerService.getAll()]);
        const customersMap = {};
        customersData.forEach(customer => {
          customersMap[customer.id] = customer;
        });
        setCustomers(customersMap);
        setInvoices(invoicesData);
        setFilteredData(invoicesData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load invoices. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...invoices];
    if (searchTerm) {
      filtered = filtered.filter(invoice => invoice.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) || (customers[invoice.customer_id]?.unit_number || "").toLowerCase().includes(searchTerm.toLowerCase()) || (customers[invoice.customer_id]?.name || "").toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (statusFilter !== "all") {
      if (statusFilter === "Overdue") {
        filtered = filtered.filter(invoice => {
          const dueDate = new Date(invoice.due_date);
          const today = new Date();
          const isPastDue = dueDate < today && invoice.payment_status !== "Paid";
          return isPastDue && invoice.payment_status === "Unpaid";
        });
      } else {
        filtered = filtered.filter(invoice => invoice.payment_status === statusFilter);
      }
    }
    setFilteredData(filtered);
  }, [searchTerm, statusFilter, invoices, customers]);

  const handlePaymentStatusChange = async (invoice, newStatus) => {
    try {
      await invoiceService.update(invoice.id, {
        payment_status: newStatus
      });
      setInvoices(prevInvoices => prevInvoices.map(inv => inv.id === invoice.id ? {
        ...inv,
        payment_status: newStatus
      } : inv));
      toast({
        title: "Status Updated",
        description: `Invoice #${invoice.reference_number} marked as ${newStatus}`
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    try {
      await invoiceService.delete(invoice.id);
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== invoice.id));
      setFilteredData(prevData => prevData.filter(inv => inv.id !== invoice.id));
      toast({
        title: "Invoice Deleted",
        description: `Invoice #${invoice.reference_number} has been removed`
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive"
      });
    }
  };

  const handleSendInvoice = (invoice) => {
    toast({
      title: "Invoice Sent",
      description: `Invoice #${invoice.reference_number} has been sent to the customer`
    });
  };

  const handleSendWhatsApp = (invoice) => {
    const viewUrl = `${window.location.origin}/invoices/view/${invoice.id}`;
    const message = `Hi! Please find your invoice #${invoice.reference_number} here: ${viewUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleExportSingleInvoice = (invoice) => {
    try {
      const data = [{
        'Invoice #': invoice.reference_number,
        'Unit #': customers[invoice.customer_id]?.unit_number || '',
        'Customer': customers[invoice.customer_id]?.name || 'Unknown',
        'Issue Date': format(new Date(invoice.issue_date), 'yyyy-MM-dd'),
        'Due Date': format(new Date(invoice.due_date), 'yyyy-MM-dd'),
        'Subtotal': parseFloat(invoice.subtotal).toFixed(2),
        'Tax': parseFloat(invoice.tax_amount).toFixed(2),
        'Total': parseFloat(invoice.total).toFixed(2),
        'Status': invoice.status,
        'Payment Status': invoice.payment_status
      }];
      
      exportService.downloadCSV(data, `invoice-${invoice.reference_number}`);
    } catch (error) {
      console.error("Error exporting invoice:", error);
      toast({
        title: "Export Failed",
        description: "Could not export invoice to CSV",
        variant: "destructive"
      });
    }
  };

  const handleViewInvoice = (invoice) => {
    const viewUrl = `${window.location.origin}/invoices/view/${invoice.id}`;
    window.open(viewUrl, '_blank');
  };

  const formatMoney = amount => {
    return `RM ${parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const exportInvoices = () => {
    try {
      const exportData = filteredData.map(invoice => {
        const customer = customers[invoice.customer_id] || {};
        return {
          'Invoice #': invoice.reference_number,
          'Unit #': customer.unit_number || '',
          'Customer': customer.name || 'Unknown',
          'Issue Date': format(new Date(invoice.issue_date), 'yyyy-MM-dd'),
          'Due Date': format(new Date(invoice.due_date), 'yyyy-MM-dd'),
          'Subtotal': parseFloat(invoice.subtotal).toFixed(2),
          'Tax': parseFloat(invoice.tax_amount).toFixed(2),
          'Total': parseFloat(invoice.total).toFixed(2),
          'Status': invoice.status,
          'Payment Status': invoice.payment_status
        };
      });
      exportService.downloadCSV(exportData, 'invoices');
      toast({
        title: "Export Complete",
        description: `${exportData.length} invoices exported to CSV file`
      });
    } catch (error) {
      console.error("Error exporting invoices:", error);
      toast({
        title: "Export Failed",
        description: "Could not export invoices to CSV",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = status => {
    if (status === "Paid") return "bg-green-100 text-green-800 hover:bg-green-100";
    if (status === "Partially Paid") return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    if (status === "Overdue") return "bg-red-100 text-red-600 hover:bg-red-100";
    return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  };

  const getStatusIcon = status => {
    if (status === "Paid") return <Check className="h-3.5 w-3.5 mr-1" />;
    if (status === "Partially Paid") return <CircleDollarSign className="h-3.5 w-3.5 mr-1" />;
    if (status === "Overdue") return <AlertTriangle className="h-3.5 w-3.5 mr-1" />;
    return <Clock className="h-3.5 w-3.5 mr-1" />;
  };

  return <div className="page-container">
      <PageHeader title="Invoices" description="" actions={<Button variant="default" className="flex items-center bg-blue-600 hover:bg-blue-700" onClick={exportInvoices}>
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>} />
      
      <div className="mt-6">
        <Card>
          <CardContent className="p-0">
            <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search invoices..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? <div className="py-8 text-center">
                <p className="text-muted-foreground">Loading invoices...</p>
              </div> : filteredData.length === 0 ? <div className="py-8 text-center">
                <p className="text-muted-foreground">No invoices found matching your criteria</p>
              </div> : <div className="overflow-x-auto">
                {isMobile ? <div className="p-2 space-y-3">
                    {filteredData.map(invoice => {
                const customer = customers[invoice.customer_id];
                const dueDate = new Date(invoice.due_date);
                const today = new Date();
                const isPastDue = dueDate < today && invoice.payment_status !== "Paid";
                const displayPaymentStatus = isPastDue && invoice.payment_status === "Unpaid" ? "Overdue" : invoice.payment_status;
                return <div key={invoice.id} className="mobile-card border-l-4 border-l-blue-500 rounded-md shadow-sm" onClick={() => navigate(`/invoices/edit/${invoice.id}`)}>
                          <div className="p-3 border-b bg-blue-50/30 flex justify-between items-center">
                            <div>
                              <div className="font-medium text-blue-700">
                                {customer ? customer.unit_number || "-" : "-"}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                <FileText className="h-3 w-3 mr-1" />
                                {invoice.reference_number}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Badge className={getStatusColor(displayPaymentStatus)}>
                                <div className="flex items-center">
                                  {getStatusIcon(displayPaymentStatus)}
                                  {displayPaymentStatus}
                                </div>
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="px-3 py-2 space-y-1.5">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />Issue Date
                              </span>
                              <span>{format(new Date(invoice.issue_date), "MMM dd, yyyy")}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1.5" />Due Date
                              </span>
                              <span className={isPastDue ? "text-red-600 font-medium" : ""}>
                                {format(dueDate, "MMM dd, yyyy")}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 flex items-center">
                                <Home className="h-3.5 w-3.5 mr-1.5" />Customer
                              </span>
                              <span className="font-medium truncate max-w-[150px]">
                                {customer ? customer.name : "Unknown"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="border-t p-2 bg-gray-50 flex justify-between items-center">
                            <span className="text-sm font-semibold text-inherit">
                              {formatMoney(invoice.total)}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleSendWhatsApp(invoice); 
                                }}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send via WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { 
                                  e.stopPropagation(); 
                                  navigate(`/invoices/edit/${invoice.id}`); 
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {invoice.payment_status !== 'Paid' && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handlePaymentStatusChange(invoice, 'Paid');
                                  }}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteInvoice(invoice);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>;
              })}
                  </div> : <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Unit #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map(invoice => {
                  const customer = customers[invoice.customer_id];
                  const dueDate = new Date(invoice.due_date);
                  const today = new Date();
                  const isPastDue = dueDate < today && invoice.payment_status !== "Paid";
                  const displayPaymentStatus = isPastDue && invoice.payment_status === "Unpaid" ? "Overdue" : invoice.payment_status;
                  return <TableRow key={invoice.id}>
                          <TableCell>
                            <div className="font-medium cursor-pointer text-blue-600" onClick={() => navigate(`/invoices/edit/${invoice.id}`)}>
                              {invoice.reference_number}
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer ? customer.unit_number || "-" : "-"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.issue_date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className={isPastDue ? "text-red-600 font-medium" : ""}>
                                {format(dueDate, "MMM dd, yyyy")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(displayPaymentStatus)}>
                              {displayPaymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatMoney(invoice.total)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSendWhatsApp(invoice)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send via WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/invoices/edit/${invoice.id}`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {invoice.payment_status !== 'Paid' && (
                                  <DropdownMenuItem onClick={() => handlePaymentStatusChange(invoice, 'Paid')}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteInvoice(invoice)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>;
                })}
                    </TableBody>
                  </Table>}
              </div>}
          </CardContent>
        </Card>
      </div>
      
      <FloatingActionButton onClick={() => navigate("/invoices/create")} />
    </div>;
}
