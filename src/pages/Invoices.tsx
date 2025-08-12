
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { invoiceService, customerService } from "@/services";
import { DataTable } from "@/components/common/DataTable";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Invoices() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceService.getAll,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll,
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCustomerName(invoice.customer_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.payment_status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'default';
      case 'partially paid':
        return 'secondary';
      case 'overdue':
        return 'destructive';
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
      header: "Due Date",
      accessorKey: "due_date",
      cell: ({ row }: any) => formatDate(row.original.due_date),
    },
    {
      header: "Total",
      accessorKey: "total",
      cell: ({ row }: any) => formatCurrency(row.original.total),
    },
    {
      header: "Status",
      accessorKey: "payment_status",
      cell: ({ row }: any) => (
        <Badge variant={getStatusVariant(row.original.payment_status)}>
          {row.original.payment_status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/invoices/view/${row.original.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/invoices/edit/${row.original.id}`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Invoices"
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button onClick={() => navigate("/invoices/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        }
      />

      <DataTable
        data={filteredInvoices}
        columns={columns}
        searchKey="reference_number"
        externalSearchTerm={searchTerm}
        onExternalSearchChange={setSearchTerm}
        isLoading={isLoading}
      />
    </div>
  );
}
