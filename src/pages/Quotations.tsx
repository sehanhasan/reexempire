
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { quotationService, customerService } from "@/services";
import { DataTable } from "@/components/common/DataTable";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Quotations() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: quotationService.getAll,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll,
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const filteredQuotations = quotations.filter(quotation =>
    quotation.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCustomerName(quotation.customer_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const columns = [
    {
      header: "Reference",
      accessorKey: "reference_number",
    },
    {
      header: "Customer",
      accessorKey: "customer_id",
      cell: ({ row }: any) => getCustomerName(row.original.customer_id),
    },
    {
      header: "Issue Date",
      accessorKey: "issue_date",
      cell: ({ row }: any) => formatDate(row.original.issue_date),
    },
    {
      header: "Expiry Date",
      accessorKey: "expiry_date",
      cell: ({ row }: any) => formatDate(row.original.expiry_date),
    },
    {
      header: "Total",
      accessorKey: "total",
      cell: ({ row }: any) => formatCurrency(row.original.total),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/quotations/view/${row.original.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/quotations/edit/${row.original.id}`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/invoices/create", { 
                state: { quotationId: row.original.id } 
              });
            }}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Quotations"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button onClick={() => navigate("/quotations/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Quotation
            </Button>
          </div>
        }
      />

      <DataTable
        data={filteredQuotations}
        columns={columns}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder="Search quotations..."
        isLoading={isLoading}
        onRowClick={(quotation) => navigate(`/quotations/view/${quotation.id}`)}
      />
    </div>
  );
}
