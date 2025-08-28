import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Download, TrendingUp, DollarSign, Eye, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { invoiceService, customerService } from "@/services";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Finance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("this-month");
  const [customDateRange, setCustomDateRange] = useState<{from?: Date; to?: Date}>({});

  const isMobile = useIsMobile();

  // Fetch invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceService.getAll
  });

  // Fetch customers for reference
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll
  });

  // Filter paid invoices based on search and month
  const filteredInvoices = invoices.filter(invoice => {
    // Only show paid invoices
    if (invoice.payment_status !== 'paid' && invoice.payment_status !== 'Paid') return false;

    // Month filter
    if (selectedMonth && selectedMonth !== 'all') {
      const invoiceDate = new Date(invoice.issue_date);
      const now = new Date();
      
      if (selectedMonth === 'this-month') {
        const thisMonth = now.toISOString().slice(0, 7);
        const invoiceMonth = invoiceDate.toISOString().slice(0, 7);
        if (invoiceMonth !== thisMonth) return false;
      } else if (selectedMonth === 'last-month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
        const invoiceMonth = invoiceDate.toISOString().slice(0, 7);
        if (invoiceMonth !== lastMonth) return false;
      } else if (selectedMonth === 'this-year') {
        const thisYear = now.getFullYear();
        const invoiceYear = invoiceDate.getFullYear();
        if (invoiceYear !== thisYear) return false;
      } else if (selectedMonth === 'custom') {
        if (customDateRange.from && invoiceDate < customDateRange.from) return false;
        if (customDateRange.to && invoiceDate > customDateRange.to) return false;
      }
    }

    // Search filter
    if (searchTerm) {
      const customer = customers.find(c => c.id === invoice.customer_id);
      const searchLower = searchTerm.toLowerCase();
      return (
        invoice.reference_number.toLowerCase().includes(searchLower) ||
        customer?.name.toLowerCase().includes(searchLower) ||
        customer?.unit_number?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Calculate revenue metrics
  const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);

  // Get today, current month, and previous month data
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
  
  const todayRevenue = invoices
    .filter(inv => (inv.payment_status === 'paid' || inv.payment_status === 'Paid') && inv.issue_date === today)
    .reduce((sum, inv) => sum + Number(inv.total), 0);
  
  const currentMonthRevenue = invoices
    .filter(inv => (inv.payment_status === 'paid' || inv.payment_status === 'Paid') && new Date(inv.issue_date).toISOString().slice(0, 7) === currentMonth)
    .reduce((sum, inv) => sum + Number(inv.total), 0);
    
  const previousMonthRevenue = invoices
    .filter(inv => (inv.payment_status === 'paid' || inv.payment_status === 'Paid') && new Date(inv.issue_date).toISOString().slice(0, 7) === previousMonth)
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const growthPercentage = previousMonthRevenue > 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
    : 0;

  const columns = [
    {
      accessorKey: "reference_number",
      header: "Invoice #",
      cell: ({ getValue }: any) => (
        <span className="font-mono text-sm">{getValue()}</span>
      )
    },
    {
      accessorKey: "customer_id",
      header: "Customer",
      cell: ({ getValue }: any) => {
        const customer = customers.find(c => c.id === getValue());
        return (
          <div>
            <div className="font-medium">{customer?.name || 'Unknown'}</div>
            {customer?.unit_number && (
              <div className="text-sm text-muted-foreground">#{customer.unit_number}</div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "issue_date",
      header: "Issue Date",
      cell: ({ getValue }: any) => formatDate(getValue())
    },
    {
      accessorKey: "total",
      header: "Amount",
      cell: ({ getValue }: any) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(Number(getValue()))}
        </span>
      )
    },
    {
      accessorKey: "payment_status",
      header: "Status",
      cell: ({ getValue }: any) => (
        <Badge variant="default" className="bg-green-100 text-green-800">
          {getValue()}
        </Badge>
      )
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`/invoices/view/${row.original.id}`, '_blank')}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      <PageHeader
        title="Finance"
        description="Track and manage paid invoices and revenue"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(todayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Today's revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current month revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs previous month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg text-cyan-600">Paid Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by invoice #, customer name, or unit #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            {selectedMonth === 'custom' && (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[140px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.from ? format(customDateRange.from, "PPP") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customDateRange.from}
                      onSelect={(date) => setCustomDateRange(prev => ({...prev, from: date}))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[140px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.to ? format(customDateRange.to, "PPP") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customDateRange.to}
                      onSelect={(date) => setCustomDateRange(prev => ({...prev, to: date}))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <Button variant="outline" onClick={() => console.log('Export functionality coming soon')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={filteredInvoices}
            searchKey="reference_number"
            isLoading={isLoading}
            emptyMessage="No paid invoices found for the selected period."
          />
        </CardContent>
      </Card>
    </div>
  );
}