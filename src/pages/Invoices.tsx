import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, TrendingUp, DollarSign, Receipt, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { invoiceService, customerService } from "@/services";
import { formatCurrency } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Invoices() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    totalAmount: 0
  });

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const invoicesData = await invoiceService.getAll();
        const customersData = await customerService.getAll();

        setInvoices(invoicesData);
        setCustomers(customersData);

        // Calculate stats
        const total = invoicesData.length;
        const paid = invoicesData.filter(invoice => invoice.payment_status === 'Paid').length;
        const unpaid = invoicesData.filter(invoice => invoice.payment_status === 'Unpaid').length;
        const totalAmount = invoicesData.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

        setStats({
          total,
          paid,
          unpaid,
          totalAmount
        });
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Paid': "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
      'Unpaid': "bg-red-100 text-red-700 hover:bg-red-100",
      'Overdue': "bg-red-100 text-red-700 hover:bg-red-100",
      'Partially Paid': "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
    };
    
    return (
      <Badge className={statusClasses[status] || "bg-slate-100 text-slate-700 hover:bg-slate-100"} variant="secondary">
        {status}
      </Badge>
    );
  };

  const handleEdit = (invoice) => {
    navigate(`/invoices/edit/${invoice.id}`);
  };

  const handleView = (invoice) => {
    navigate(`/invoices/view/${invoice.id}`);
  };

  const handleDelete = async (invoice) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoiceService.delete(invoice.id);
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const columns = [
    {
      header: "Reference",
      accessorKey: "reference_number",
      cell: ({ row }) => (
        <div className="font-medium text-slate-900">
          {row.original.reference_number}
        </div>
      )
    },
    {
      header: "Customer",
      accessorKey: "customer_name",
      cell: ({ row }) => {
        const customer = customers.find(c => c.id === row.original.customer_id);
        return (
          <div>
            <div className="font-medium text-slate-900">
              {customer?.unit_number ? `#${customer.unit_number}` : 'No Unit'}
            </div>
            <div className="text-sm text-slate-600">{customer?.name || 'Unknown'}</div>
          </div>
        );
      }
    },
    {
      header: "Amount",
      accessorKey: "total",
      cell: ({ row }) => (
        <div className="font-semibold text-slate-900">
          {formatCurrency(row.original.total)}
        </div>
      )
    },
    {
      header: "Status",
      accessorKey: "payment_status",
      cell: ({ row }) => getStatusBadge(row.original.payment_status)
    },
    {
      header: "Date",
      accessorKey: "issue_date",
      cell: ({ row }) => (
        <div className="text-sm text-slate-600">
          {new Date(row.original.issue_date).toLocaleDateString()}
        </div>
      )
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(row.original)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
            className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const renderCustomMobileCard = (invoice) => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    
    return (
      <Card key={invoice.id} className="overflow-hidden border-l-4 border-l-emerald-500 shadow-sm">
        <CardContent className="p-0">
          <div 
            className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 cursor-pointer hover:from-emerald-100 hover:to-teal-100 transition-all"
            onClick={() => handleView(invoice)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-emerald-700 text-sm">
                  {customer?.unit_number ? `#${customer.unit_number}` : 'No Unit'}
                </h3>
                <p className="text-xs text-slate-600 mt-1">{customer?.name || 'Unknown Customer'}</p>
              </div>
              {getStatusBadge(invoice.payment_status)}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Reference:</span>
                <span className="font-medium text-slate-900">{invoice.reference_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Amount:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Date:</span>
                <span className="text-slate-700">{new Date(invoice.issue_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t p-3 bg-slate-50 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(invoice);
              }}
              className="text-slate-600 hover:text-slate-700"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(invoice);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="page-container min-h-screen bg-slate-50">
      <div className="p-4 space-y-6">
        <PageHeader
          title="Invoices"
          actions={
            <Button onClick={() => navigate("/invoices/create")} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Total Invoices</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.total}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">Active</span>
                  </div>
                </div>
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Receipt className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Paid</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.paid}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">Collected</span>
                  </div>
                </div>
                <div className="p-2 bg-green-500 rounded-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Unpaid</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">{stats.unpaid}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-red-600 font-medium">Pending</span>
                  </div>
                </div>
                <div className="p-2 bg-red-500 rounded-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Total Value</p>
                  <p className="text-xl font-bold text-amber-900 mt-1">{formatCurrency(stats.totalAmount)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">Revenue</span>
                  </div>
                </div>
                <div className="p-2 bg-amber-500 rounded-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={invoices}
          searchKey="reference_number"
          isLoading={loading}
          emptyMessage="No invoices found"
          renderCustomMobileCard={renderCustomMobileCard}
          externalSearchTerm={searchTerm}
          onExternalSearchChange={setSearchTerm}
          onRowClick={handleView}
        />
      </div>
    </div>
  );
}
