import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Download, TrendingUp, DollarSign, Eye } from "lucide-react";
import { invoiceService, customerService } from "@/services";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Finance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

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
    if (invoice.payment_status !== 'Paid') return false;

    // Month filter - "all" means show all months
    if (selectedMonth && selectedMonth !== 'all') {
      const invoiceMonth = new Date(invoice.issue_date).toISOString().slice(0, 7);
      if (invoiceMonth !== selectedMonth) return false;
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

  // Calculate total revenue for the selected period
  const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);

  // Get current and previous month data for comparison
  const currentMonth = new Date().toISOString().slice(0, 7);
  const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
  
  const currentMonthRevenue = invoices
    .filter(inv => inv.payment_status === 'Paid' && new Date(inv.issue_date).toISOString().slice(0, 7) === currentMonth)
    .reduce((sum, inv) => sum + Number(inv.total), 0);
    
  const previousMonthRevenue = invoices
    .filter(inv => inv.payment_status === 'Paid' && new Date(inv.issue_date).toISOString().slice(0, 7) === previousMonth)
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
            <CardTitle className="text-sm font-medium">Selected Period Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.length} paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const value = date.toISOString().slice(0, 7);
                  const label = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  });
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
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