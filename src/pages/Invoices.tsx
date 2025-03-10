import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { 
  Eye, 
  Edit, 
  MoreHorizontal, 
  CalendarClock, 
  Download,
  Plus,
  Search,
  Check,
  Send,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { invoiceService, customerService, exportService } from "@/services";
import { format } from "date-fns";

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [invoicesData, customersData] = await Promise.all([
          invoiceService.getAll(),
          customerService.getAll()
        ]);

        // Create a map of customers for easy lookup
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
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Filter data when search term or status filter changes
    let filtered = [...invoices];

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customers[invoice.customer_id]?.unit_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customers[invoice.customer_id]?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status or overdue
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
      await invoiceService.update(invoice.id, { payment_status: newStatus });
      // Update local state
      setInvoices(prevInvoices =>
        prevInvoices.map(inv =>
          inv.id === invoice.id ? { ...inv, payment_status: newStatus } : inv
        )
      );
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

  const formatMoney = amount => {
    return `RM ${parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const exportInvoices = () => {
    try {
      // Prepare data for export - transform to more readable format
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
      // Export to CSV
      exportService.downloadCSV(exportData, 'invoices');
      toast({
        title: "Export Complete",
        description: `${exportData.length} invoices exported to CSV file`,
      });
    } catch (error) {
      console.error("Error exporting invoices:", error);
      toast({
        title: "Export Failed",
        description: "Could not export invoices to CSV",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Invoices" 
        description="Manage your invoice records"
        actions={
          <Button 
            variant="default" 
            className="flex items-center bg-blue-600 hover:bg-blue-700" 
            onClick={exportInvoices}
          >
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        }
      />
      
      <div className="mt-6">
        <Card>
          <CardContent className="p-0">
            <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                    {/* New Overdue option */}
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Loading invoices...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No invoices found matching your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Unit #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map(invoice => {
                      const customer = customers[invoice.customer_id];
                      const dueDate = new Date(invoice.due_date);
                      const today = new Date();
                      const isPastDue = dueDate < today && invoice.payment_status !== "Paid";
                      
                      // If invoice is "Unpaid" and past due, display "Overdue"
                      const displayPaymentStatus = isPastDue && invoice.payment_status === "Unpaid"
                        ? "Overdue"
                        : invoice.payment_status;

                      return (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div 
                              className="font-medium cursor-pointer text-blue-600"
                              onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                            >
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
                              {/* Overdue badge removed here */}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                displayPaymentStatus === "Paid"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : displayPaymentStatus === "Partially Paid"
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                  : displayPaymentStatus === "Overdue"
                                  ? "bg-red-100 text-red-600 hover:bg-red-100"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              }
                            >
                              {displayPaymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatMoney(invoice.total)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => navigate(`/invoices/edit/${invoice.id}?mode=edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px]">
                                  <DropdownMenuItem 
                                    className="cursor-pointer"
                                    onClick={() => console.log("Send invoice")}
                                  >
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Invoice
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {invoice.payment_status !== "Paid" && (
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-green-600"
                                      onClick={() => handlePaymentStatusChange(invoice, "Paid")}
                                    >
                                      <Check className="mr-2 h-4 w-4" />
                                      Mark as Paid
                                    </DropdownMenuItem>
                                  )}
                                  {invoice.payment_status !== "Partially Paid" && (
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-amber-600"
                                      onClick={() => handlePaymentStatusChange(invoice, "Partially Paid")}
                                    >
                                      <CalendarClock className="mr-2 h-4 w-4" />
                                      Mark as Partially Paid
                                    </DropdownMenuItem>
                                  )}
                                  {invoice.payment_status !== "Unpaid" && (
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-amber-600"
                                      onClick={() => handlePaymentStatusChange(invoice, "Unpaid")}
                                    >
                                      <CalendarClock className="mr-2 h-4 w-4" />
                                      Mark as Unpaid
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <FloatingActionButton 
        onClick={() => navigate("/invoices/create")} />
      />
    </div>
  );
}
