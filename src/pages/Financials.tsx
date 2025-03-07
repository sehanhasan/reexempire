
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { 
  Download, 
  FileText, 
  Filter, 
  Printer, 
  CalendarRange, 
  RefreshCcw, 
  SearchIcon, 
  ArrowUpDown,
  Check
} from "lucide-react";
import { invoiceService } from "@/services";
import { formatCurrency } from "@/utils/formatters";
import { format, startOfMonth, endOfMonth, subDays, subMonths } from "date-fns";

export default function Financials() {
  const navigate = useNavigate();
  
  // State for invoices data
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for filters
  const [dateRange, setDateRange] = useState("this-month");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for export dialog
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  
  // Stats
  const [stats, setStats] = useState({
    totalInvoiced: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    totalOverdue: 0,
    avgInvoiceValue: 0
  });
  
  // Fetch invoice data
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const data = await invoiceService.getAll();
        setInvoices(data);
        applyFilters(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching invoices:", error);
        toast({
          title: "Error",
          description: "Failed to load invoice data. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    fetchInvoices();
  }, []);
  
  // Apply all filters whenever filter states change
  useEffect(() => {
    applyFilters(invoices);
  }, [startDate, endDate, paymentStatus, searchQuery]);
  
  // Update date range based on preset selection
  useEffect(() => {
    switch (dateRange) {
      case "this-month":
        setStartDate(format(startOfMonth(new Date()), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(new Date()), "yyyy-MM-dd"));
        break;
      case "last-month":
        const lastMonth = subMonths(new Date(), 1);
        setStartDate(format(startOfMonth(lastMonth), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
        break;
      case "last-30-days":
        setStartDate(format(subDays(new Date(), 30), "yyyy-MM-dd"));
        setEndDate(format(new Date(), "yyyy-MM-dd"));
        break;
      case "last-90-days":
        setStartDate(format(subDays(new Date(), 90), "yyyy-MM-dd"));
        setEndDate(format(new Date(), "yyyy-MM-dd"));
        break;
      case "year-to-date":
        setStartDate(format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"));
        setEndDate(format(new Date(), "yyyy-MM-dd"));
        break;
      case "custom":
        // Don't change dates for custom range
        break;
    }
  }, [dateRange]);
  
  // Apply all filters to the invoice data
  const applyFilters = (data) => {
    if (!data || !data.length) {
      setFilteredInvoices([]);
      updateStats([]);
      return;
    }
    
    let filtered = [...data];
    
    // Apply date filter
    filtered = filtered.filter(invoice => {
      const invoiceDate = new Date(invoice.issue_date);
      return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
    });
    
    // Apply payment status filter
    if (paymentStatus !== "all") {
      filtered = filtered.filter(invoice => invoice.payment_status === paymentStatus);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.reference_number.toLowerCase().includes(query) ||
        (invoice.notes && invoice.notes.toLowerCase().includes(query))
      );
    }
    
    setFilteredInvoices(filtered);
    updateStats(filtered);
  };
  
  // Update financial statistics based on filtered data
  const updateStats = (data) => {
    if (!data.length) {
      setStats({
        totalInvoiced: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        totalOverdue: 0,
        avgInvoiceValue: 0
      });
      return;
    }
    
    const totalInvoiced = data.reduce((sum, invoice) => {
      const total = typeof invoice.total === 'number' ? invoice.total : 
                    (invoice.total ? Number(invoice.total) : 0);
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
    
    const paidInvoices = data.filter(invoice => invoice.payment_status === "Paid");
    const totalPaid = paidInvoices.reduce((sum, invoice) => {
      const total = typeof invoice.total === 'number' ? invoice.total : 
                    (invoice.total ? Number(invoice.total) : 0);
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
    
    const unpaidInvoices = data.filter(invoice => invoice.payment_status === "Unpaid");
    const totalUnpaid = unpaidInvoices.reduce((sum, invoice) => {
      const total = typeof invoice.total === 'number' ? invoice.total : 
                    (invoice.total ? Number(invoice.total) : 0);
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
    
    // Calculate overdue invoices (unpaid and past due date)
    const today = new Date();
    const overdueInvoices = data.filter(invoice => 
      invoice.payment_status === "Unpaid" && new Date(invoice.due_date) < today
    );
    
    const totalOverdue = overdueInvoices.reduce((sum, invoice) => {
      const total = typeof invoice.total === 'number' ? invoice.total : 
                    (invoice.total ? Number(invoice.total) : 0);
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
    
    // Calculate average invoice value
    const avgInvoiceValue = data.length > 0 ? totalInvoiced / data.length : 0;
    
    setStats({
      totalInvoiced,
      totalPaid,
      totalUnpaid,
      totalOverdue,
      avgInvoiceValue
    });
  };
  
  // Handle custom date range changes
  const handleDateChange = (field, value) => {
    if (field === "start") {
      setStartDate(value);
      setDateRange("custom");
    } else if (field === "end") {
      setEndDate(value);
      setDateRange("custom");
    }
  };
  
  // Export data to CSV
  const exportToCSV = () => {
    const headers = [
      "Reference Number", 
      "Issue Date", 
      "Due Date", 
      "Customer", 
      "Total", 
      "Payment Status"
    ];
    
    const csvData = filteredInvoices.map(invoice => [
      invoice.reference_number,
      format(new Date(invoice.issue_date), "yyyy-MM-dd"),
      format(new Date(invoice.due_date), "yyyy-MM-dd"),
      invoice.customer_id, // Ideally this would be customer name, but we only have ID
      invoice.total,
      invoice.payment_status
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportDialog(false);
    
    toast({
      title: "Export Complete",
      description: "Financial report has been exported successfully.",
    });
  };
  
  // Define table columns
  const columns = [
    {
      header: "Invoice #",
      accessorKey: "reference_number",
      cell: ({ row }) => (
        <div 
          className="font-medium text-blue-600 cursor-pointer"
          onClick={() => navigate(`/invoices/edit/${row.original.id}`)}
        >
          {row.original.reference_number}
        </div>
      ),
    },
    {
      header: "Issue Date",
      accessorKey: "issue_date",
      cell: ({ row }) => format(new Date(row.original.issue_date), "MMM dd, yyyy"),
    },
    {
      header: "Due Date",
      accessorKey: "due_date",
      cell: ({ row }) => format(new Date(row.original.due_date), "MMM dd, yyyy"),
    },
    {
      header: "Customer",
      accessorKey: "customer_id",
    },
    {
      header: () => (
        <div className="text-right">Amount</div>
      ),
      accessorKey: "total",
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(row.original.total)}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "payment_status",
      cell: ({ row }) => {
        const status = row.original.payment_status;
        return (
          <Badge className={
            status === "Paid" ? "bg-green-100 text-green-800" :
            status === "Partial" ? "bg-amber-100 text-amber-800" :
            // Check if it's unpaid and overdue
            (status === "Unpaid" && new Date(row.original.due_date) < new Date()) ?
              "bg-red-200 text-red-800" : "bg-red-100 text-red-800"
          }>
            {status === "Unpaid" && new Date(row.original.due_date) < new Date() ? 
              "Overdue" : status}
          </Badge>
        );
      },
    },
  ];
  
  return (
    <div className="page-container">
      <PageHeader 
        title="Financial Reports" 
        description="Analyze your financial performance and revenue data."
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => navigate("/invoices/create")}>
              <FileText className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        }
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invoiced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalInvoiced)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPaid)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Unpaid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(stats.totalUnpaid)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalOverdue)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.avgInvoiceValue)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="dateRange">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                  <SelectItem value="year-to-date">Year to Date</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input 
                id="startDate" 
                type="date" 
                value={startDate}
                onChange={(e) => handleDateChange("start", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input 
                id="endDate" 
                type="date" 
                value={endDate}
                onChange={(e) => handleDateChange("end", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger id="paymentStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice # or notes..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setDateRange("this-month");
                setPaymentStatus("all");
                setSearchQuery("");
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Data Table */}
      <div className="mt-6">
        <DataTable 
          columns={columns} 
          data={filteredInvoices} 
          searchKey="reference_number" 
          isLoading={isLoading}
        />
      </div>
      
      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Financial Report</DialogTitle>
            <DialogDescription>
              Choose your preferred format for the financial report export.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Label htmlFor="export-format">Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger id="export-format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV File (.csv)</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground mt-2">
              <p>Data to be exported:</p>
              <ul className="list-disc list-inside mt-1">
                <li>{filteredInvoices.length} invoice records</li>
                <li>Date range: {format(new Date(startDate), "MMM dd, yyyy")} to {format(new Date(endDate), "MMM dd, yyyy")}</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
