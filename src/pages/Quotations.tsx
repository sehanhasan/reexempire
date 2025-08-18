import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, TrendingUp, DollarSign, ReceiptText, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { quotationService, customerService } from "@/services";
import { formatCurrency } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Quotations() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    totalAmount: 0
  });

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        setLoading(true);
        const [quotationsData, customersData] = await Promise.all([
          quotationService.getAll(),
          customerService.getAll()
        ]);

        setQuotations(quotationsData);
        setCustomers(customersData);

        // Calculate stats
        const totalAmount = quotationsData.reduce((sum, quotation) => sum + Number(quotation.total || 0), 0);
        const approvedCount = quotationsData.filter(q => q.status === 'Approved' || q.status === 'Accepted').length;
        const pendingCount = quotationsData.filter(q => q.status === 'Sent' || q.status === 'Draft').length;

        setStats({
          total: quotationsData.length,
          approved: approvedCount,
          pending: pendingCount,
          totalAmount: totalAmount
        });
      } catch (error) {
        console.error("Error fetching quotations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Approved': "bg-green-100 text-green-700 hover:bg-green-100",
      'Accepted': "bg-green-100 text-green-700 hover:bg-green-100",
      'Sent': "bg-blue-100 text-blue-700 hover:bg-blue-100",
      'Draft': "bg-slate-100 text-slate-700 hover:bg-slate-100",
      'Rejected': "bg-red-100 text-red-700 hover:bg-red-100"
    };
    
    return (
      <Badge className={statusClasses[status] || "bg-slate-100 text-slate-700 hover:bg-slate-100"} variant="secondary">
        {status}
      </Badge>
    );
  };

  const handleEdit = (quotation) => {
    navigate(`/quotations/edit/${quotation.id}`);
  };

  const handleView = (quotation) => {
    navigate(`/quotations/view/${quotation.id}`);
  };

  const handleDelete = async (quotation) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await quotationService.delete(quotation.id);
        fetchQuotations();
      } catch (error) {
        console.error('Error deleting quotation:', error);
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
      accessorKey: "status",
      cell: ({ row }) => getStatusBadge(row.original.status)
    },
    {
      header: "Date",
      accessorKey: "created_at",
      cell: ({ row }) => (
        <div className="text-sm text-slate-600">
          {new Date(row.original.created_at).toLocaleDateString()}
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
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
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

  const renderCustomMobileCard = (quotation) => {
    const customer = customers.find(c => c.id === quotation.customer_id);
    
    return (
      <Card key={quotation.id} className="overflow-hidden border-l-4 border-l-purple-500 shadow-sm">
        <CardContent className="p-0">
          <div 
            className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 cursor-pointer hover:from-purple-100 hover:to-pink-100 transition-all"
            onClick={() => handleView(quotation)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-purple-700 text-sm">
                  {customer?.unit_number ? `#${customer.unit_number}` : 'No Unit'}
                </h3>
                <p className="text-xs text-slate-600 mt-1">{customer?.name || 'Unknown Customer'}</p>
              </div>
              {getStatusBadge(quotation.status)}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Reference:</span>
                <span className="font-medium text-slate-900">{quotation.reference_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Amount:</span>
                <span className="font-bold text-purple-700">{formatCurrency(quotation.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Date:</span>
                <span className="text-slate-700">{new Date(quotation.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t p-3 bg-slate-50 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(quotation);
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
                handleDelete(quotation);
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
          title="Quotations"
          actions={
            <Button onClick={() => navigate("/quotations/create")} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Quotation
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Total Quotations</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{stats.total}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">Active</span>
                  </div>
                </div>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <ReceiptText className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Approved</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.approved}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600 font-medium">Confirmed</span>
                  </div>
                </div>
                <div className="p-2 bg-green-500 rounded-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Pending</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.pending}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-blue-600 font-medium">Awaiting</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-500 rounded-lg">
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
                    <span className="text-xs text-green-600 font-medium">Potential</span>
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
          data={quotations}
          searchKey="reference_number"
          isLoading={loading}
          emptyMessage="No quotations found"
          renderCustomMobileCard={renderCustomMobileCard}
          externalSearchTerm={searchTerm}
          onExternalSearchChange={setSearchTerm}
          onRowClick={handleView}
        />
      </div>
    </div>
  );
}
