
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, FileText, Eye, Edit, Trash2, Share, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import { FloatingActionButton } from '@/components/common/FloatingActionButton';
import { quotationService } from '@/services/quotationService';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from 'sonner';
import { useQuotationUpdates } from '@/hooks/useQuotationUpdates';

export default function Quotations() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Use real-time updates hook
  useQuotationUpdates();

  const { data: quotations = [], isLoading, refetch } = useQuery({
    queryKey: ['quotations'],
    queryFn: quotationService.getAll,
  });

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = quotation.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.customer_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || quotation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) {
      return;
    }

    try {
      await quotationService.delete(id);
      toast.success('Quotation deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast.error('Failed to delete quotation');
    }
  };

  const handleShare = async (quotation: any) => {
    const previewUrl = `${window.location.origin}/quotations/view/${quotation.id}`;
    const whatsappUrl = quotationService.generateWhatsAppShareUrl(
      quotation.id,
      quotation.reference_number,
      'Customer', // You might want to fetch customer name
      previewUrl
    );
    
    window.open(whatsappUrl, '_blank');
  };

  const handleDownload = async (quotation: any) => {
    // Implement PDF download logic
    toast.info('PDF download feature coming soon');
  };

  const columns = [
    {
      accessorKey: 'reference_number',
      header: 'Reference #',
      cell: ({ row }: { row: { original: any } }) => (
        <div className="font-medium">{row.original.reference_number}</div>
      ),
    },
    {
      accessorKey: 'customer_id',
      header: 'Customer',
      cell: ({ row }: { row: { original: any } }) => (
        <div>{row.original.customer_id}</div>
      ),
    },
    {
      accessorKey: 'issue_date',
      header: 'Issue Date',
      cell: ({ row }: { row: { original: any } }) => formatDate(row.original.issue_date),
    },
    {
      accessorKey: 'expiry_date',
      header: 'Expiry Date',
      cell: ({ row }: { row: { original: any } }) => formatDate(row.original.expiry_date),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }: { row: { original: any } }) => formatCurrency(row.original.total),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: any } }) => {
        const status = row.original.status as string;
        const variant = status === 'Accepted' ? 'default' : status === 'Rejected' ? 'destructive' : 'secondary';
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: any } }) => {
        const quotation = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/quotations/view/${quotation.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/quotations/edit/${quotation.id}`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare(quotation)}
            >
              <Share className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(quotation)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(quotation.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        description="Manage your quotations and track their status"
        actions={
          <Button onClick={() => navigate('/quotations/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Quotation
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </CardContent>
      </Card>

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Quotations ({filteredQuotations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredQuotations}
          />
        </CardContent>
      </Card>

      <FloatingActionButton
        onClick={() => navigate('/quotations/create')}
        icon={<Plus className="h-4 w-4" />}
      />
    </div>
  );
}
