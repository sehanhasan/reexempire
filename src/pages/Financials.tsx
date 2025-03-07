
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import { invoiceService, customerService } from "@/services";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/common/DateRangePicker";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parse } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";
import { FileDown, Search, Banknote, Download, Filter, PieChart, ReceiptText } from "lucide-react";
import { Invoice, Customer } from "@/types/database";
import { formatCurrency } from "@/utils/formatters";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Financials() {
  const isMobile = useIsMobile();
  
  // State for date range (default: current month)
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // State for filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  
  // State for data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Financial metrics
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    paidInvoices: 0,
    pendingPayments: 0,
    averageInvoiceValue: 0
  });

  // State for monthly revenue data
  const [revenueData, setRevenueData] = useState([]);
  const [paymentStatusData, setPaymentStatusData] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch invoices and customers
        const [invoicesData, customersData] = await Promise.all([
          invoiceService.getAll(),
          customerService.getAll()
        ]);
        
        setInvoices(invoicesData);
        setCustomers(customersData);
        
        // Apply initial filters
        const filtered = applyFilters(invoicesData, dateRange, statusFilter, customerFilter, searchQuery);
        setFilteredInvoices(filtered);
        
        // Calculate metrics
        calculateMetrics(filtered);
        
        // Generate chart data
        generateChartData(filtered);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching financials data:", error);
        toast({
          title: "Error",
          description: "Failed to load financial data. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply filters when filter criteria change
  useEffect(() => {
    const filtered = applyFilters(invoices, dateRange, statusFilter, customerFilter, searchQuery);
    setFilteredInvoices(filtered);
    calculateMetrics(filtered);
    generateChartData(filtered);
  }, [dateRange, statusFilter, customerFilter, searchQuery, invoices]);
  
  // Function to apply all filters
  const applyFilters = (allInvoices, dateRange, status, customerId, search) => {
    if (!allInvoices) return [];
    
    return allInvoices.filter(invoice => {
      // Date range filter
      const invoiceDate = new Date(invoice.issue_date);
      const isInDateRange = dateRange.from && dateRange.to ? 
        isWithinInterval(invoiceDate, { start: dateRange.from, end: dateRange.to }) : true;
      
      // Payment status filter
      const matchesStatus = status === "all" || invoice.payment_status === status;
      
      // Customer filter
      const matchesCustomer = customerId === "all" || invoice.customer_id === customerId;
      
      // Search filter (checks reference number)
      const matchesSearch = search === "" || 
        invoice.reference_number.toLowerCase().includes(search.toLowerCase());
      
      return isInDateRange && matchesStatus && matchesCustomer && matchesSearch;
    });
  };
  
  // Calculate financial metrics
  const calculateMetrics = (filteredInvoices) => {
    if (!filteredInvoices.length) {
      setMetrics({
        totalRevenue: 0,
        paidInvoices: 0,
        pendingPayments: 0,
        averageInvoiceValue: 0
      });
      return;
    }
    
    const paidInvoices = filteredInvoices.filter(inv => inv.payment_status === "Paid");
    const pendingInvoices = filteredInvoices.filter(inv => inv.payment_status === "Unpaid" || inv.payment_status === "Partially Paid");
    
    // Calculate total revenue (from paid invoices)
    const totalRevenue = paidInvoices.reduce((total, invoice) => {
      const invoiceAmount = typeof invoice.total === 'number' ? invoice.total : 
        (invoice.total ? Number(invoice.total) : 0);
      return total + invoiceAmount;
    }, 0);
    
    // Calculate pending payments
    const pendingPayments = pendingInvoices.reduce((total, invoice) => {
      const invoiceAmount = typeof invoice.total === 'number' ? invoice.total : 
        (invoice.total ? Number(invoice.total) : 0);
      return total + invoiceAmount;
    }, 0);
    
    // Calculate average invoice value
    const averageInvoiceValue = filteredInvoices.length > 0 ? 
      filteredInvoices.reduce((total, invoice) => {
        const invoiceAmount = typeof invoice.total === 'number' ? invoice.total : 
          (invoice.total ? Number(invoice.total) : 0);
        return total + invoiceAmount;
      }, 0) / filteredInvoices.length : 0;
    
    setMetrics({
      totalRevenue,
      paidInvoices: paidInvoices.length,
      pendingPayments,
      averageInvoiceValue
    });
  };
  
  // Generate data for charts
  const generateChartData = (filteredInvoices) => {
    // Monthly revenue chart data (last 6 months)
    const sixMonthsAgo = subMonths(new Date(), 5);
    const monthNames = Array.from({length: 6}, (_, i) => {
      const date = subMonths(new Date(), 5-i);
      return format(date, 'MMM');
    });
    
    // Initialize monthly data with zeros
    const monthlyData = monthNames.map(month => ({
      month,
      revenue: 0,
      count: 0
    }));
    
    // Fill in the data
    filteredInvoices.forEach(invoice => {
      if (invoice.payment_status === "Paid" && invoice.issue_date) {
        const invoiceDate = new Date(invoice.issue_date);
        if (invoiceDate >= sixMonthsAgo) {
          const monthIndex = format(invoiceDate, 'MMM');
          const monthDataIndex = monthlyData.findIndex(data => data.month === monthIndex);
          
          if (monthDataIndex >= 0) {
            const invoiceAmount = typeof invoice.total === 'number' ? invoice.total : 
              (invoice.total ? Number(invoice.total) : 0);
            
            monthlyData[monthDataIndex].revenue += invoiceAmount;
            monthlyData[monthDataIndex].count += 1;
          }
        }
      }
    });
    
    setRevenueData(monthlyData);
    
    // Payment status distribution data
    const statusCounts = {
      "Paid": 0,
      "Partially Paid": 0,
      "Unpaid": 0
    };
    
    filteredInvoices.forEach(invoice => {
      if (statusCounts.hasOwnProperty(invoice.payment_status)) {
        statusCounts[invoice.payment_status]++;
      }
    });
    
    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      value: count
    }));
    
    setPaymentStatusData(statusData);
  };
  
  // Export data to CSV
  const exportToCSV = () => {
    if (filteredInvoices.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export.",
        variant: "destructive"
      });
      return;
    }
    
    // Map customer IDs to names
    const customerMap = {};
    customers.forEach(customer => {
      customerMap[customer.id] = customer.name;
    });
    
    // Prepare data for CSV
    const csvData = filteredInvoices.map(invoice => ({
      "Reference Number": invoice.reference_number,
      "Customer": customerMap[invoice.customer_id] || "Unknown",
      "Issue Date": format(new Date(invoice.issue_date), "yyyy-MM-dd"),
      "Due Date": format(new Date(invoice.due_date), "yyyy-MM-dd"),
      "Status": invoice.status,
      "Payment Status": invoice.payment_status,
      "Total (RM)": invoice.total
    }));
    
    // Convert to CSV
    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map(row => 
      Object.values(row).map(value => 
        typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value
      ).join(",")
    ).join("\n");
    
    const csv = `${headers}\n${rows}`;
    
    // Create and download file
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financials_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Financial data has been exported to CSV.",
    });
  };
  
  // Find customer name by ID
  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "Unknown Customer";
  };
  
  // Table columns definition
  const columns = [
    {
      header: "Reference Number",
      accessorKey: "reference_number",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.reference_number}
        </span>
      )
    },
    {
      header: "Customer",
      accessorKey: "customer_id",
      cell: ({ row }) => getCustomerName(row.original.customer_id)
    },
    {
      header: "Issue Date",
      accessorKey: "issue_date",
      cell: ({ row }) => format(new Date(row.original.issue_date), "dd MMM yyyy")
    },
    {
      header: "Due Date",
      accessorKey: "due_date",
      cell: ({ row }) => format(new Date(row.original.due_date), "dd MMM yyyy")
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge className={
          row.original.status === "Completed" ? "bg-green-100 text-green-800" :
          row.original.status === "Draft" ? "bg-gray-100 text-gray-800" :
          "bg-blue-100 text-blue-800"
        }>
          {row.original.status}
        </Badge>
      )
    },
    {
      header: "Payment Status",
      accessorKey: "payment_status",
      cell: ({ row }) => (
        <Badge className={
          row.original.payment_status === "Paid" ? "bg-green-100 text-green-800" :
          row.original.payment_status === "Unpaid" ? "bg-red-100 text-red-800" :
          "bg-yellow-100 text-yellow-800"
        }>
          {row.original.payment_status}
        </Badge>
      )
    },
    {
      header: "Total",
      accessorKey: "total",
      cell: ({ row }) => formatCurrency(row.original.total)
    }
  ];
  
  return (
    <div className="page-container">
      <PageHeader
        title="Financial Reports"
        description="Analyze your business financial performance"
        actions={
          <Button onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        }
      />
      
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Banknote className="h-4 w-4 text-green-500 mr-2" />
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalRevenue)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ReceiptText className="h-4 w-4 text-green-500 mr-2" />
              <div className="text-2xl font-bold">
                {metrics.paidInvoices}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileDown className="h-4 w-4 text-amber-500 mr-2" />
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.pendingPayments)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Invoice Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <PieChart className="h-4 w-4 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.averageInvoiceValue)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <DatePickerWithRange
                dateRange={dateRange}
                setDateRange={setDateRange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Payment Status</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={customerFilter}
                onValueChange={setCustomerFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Search by reference number..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts and Data Tabs */}
      <Tabs defaultValue="table" className="mt-6">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={filteredInvoices}
                searchKey="reference_number"
                isLoading={isLoading}
                searchDisabled={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="charts" className="pt-4">
          <div className="grid grid-cols-1 gap-6">
            {/* Monthly Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => `RM ${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`RM ${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Legend />
                    <Bar 
                      dataKey="revenue" 
                      name="Revenue" 
                      fill="#3b82f6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Payment Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentStatusData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="status" 
                      type="category"
                      width={150}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="value" 
                      name="Number of Invoices"
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.status === "Paid" ? "#22c55e" :
                            entry.status === "Unpaid" ? "#ef4444" : "#f59e0b"
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
