import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { PaginationControls } from "@/components/common/PaginationControls";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Pencil, MoreHorizontal, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { customerService, invoiceService } from "@/services";
import { formatDate } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { usePagination } from "@/hooks/usePagination";
export default function Warranty() {
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch warranty items
  const {
    data: warrantyItems = [],
    isLoading
  } = useQuery({
    queryKey: ['warranty-items'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('warranty_items').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data;
    }
  });

  // Fetch customers and invoices
  const {
    data: customers = []
  } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll
  });
  const {
    data: invoices = []
  } = useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceService.getAll
  });

  // Delete warranty item mutation
  const deleteWarrantyMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('warranty_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['warranty-items']
      });
      toast({
        title: "Success",
        description: "Warranty item deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete warranty item",
        variant: "destructive"
      });
    }
  });

  // Filter warranty items based on search
  const filteredWarrantyItems = warrantyItems.filter(item => {
    if (!searchTerm) return true;
    const customer = customers.find(c => c.id === item.customer_id);
    const invoice = invoices.find(i => i.id === item.invoice_id);
    const searchLower = searchTerm.toLowerCase();
    return item.item_name.toLowerCase().includes(searchLower) || item.serial_number?.toLowerCase().includes(searchLower) || customer?.name.toLowerCase().includes(searchLower) || customer?.unit_number?.toLowerCase().includes(searchLower) || invoice?.reference_number.toLowerCase().includes(searchLower);
  });
  const {
    pagination,
    controls,
    paginatedData
  } = usePagination(filteredWarrantyItems.length, 10);
  const getWarrantyStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return {
      status: 'Expired',
      variant: 'destructive' as const
    };
    if (daysUntilExpiry <= 30) return {
      status: 'Expiring Soon',
      variant: 'secondary' as const
    };
    return {
      status: 'Active',
      variant: 'default' as const,
      className: 'bg-green-600 text-white hover:bg-green-700'
    };
  };
  const columns = [{
    accessorKey: "item_name",
    header: "Item Name",
    cell: ({
      row
    }: any) => <div>
          <button onClick={() => navigate(`/edit-warranty-item/${row.original.id}`)} className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left">
            {row.original.item_name}
          </button>
          <div className="text-sm text-muted-foreground">
            Qty: {row.original.quantity || 1}
          </div>
        </div>
  }, {
    accessorKey: "serial_number",
    header: "Serial #",
    cell: ({
      getValue
    }: any) => <span className="font-mono text-sm">
          {getValue() || '-'}
        </span>
  }, {
    accessorKey: "customer_id",
    header: "Customer",
    cell: ({
      getValue
    }: any) => {
      const customer = customers.find(c => c.id === getValue());
      return <div>
            <div className="font-medium">{customer?.name || 'Unknown'}</div>
            {customer?.unit_number && <div className="text-sm text-muted-foreground">#{customer.unit_number}</div>}
          </div>;
    }
  }, {
    accessorKey: "invoice_id",
    header: "Invoice #",
    cell: ({
      getValue
    }: any) => {
      const invoice = invoices.find(i => i.id === getValue());
      return <span className="font-mono text-sm">
            {invoice?.reference_number || '-'}
          </span>;
    }
  }, {
    accessorKey: "issue_date",
    header: "Issue Date",
    cell: ({
      getValue
    }: any) => formatDate(getValue())
  }, {
    accessorKey: "expiry_date",
    header: "Expiry Date",
    cell: ({
      getValue
    }: any) => {
      const {
        status,
        variant,
        className
      } = getWarrantyStatus(getValue());
      return <div>
            <div>{formatDate(getValue())}</div>
            <Badge variant={variant} className={`mt-1 ${className || ''}`}>
              {status}
            </Badge>
          </div>;
    }
  }, {
    accessorKey: "actions",
    header: "Actions",
    cell: ({
      row
    }: any) => <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4 text-blue-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/edit-warranty-item/${row.original.id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-red-600" onSelect={e => e.preventDefault()}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete warranty item?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the warranty item.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWarrantyMutation.mutate(row.original.id);
                        }} 
                        className="bg-red-600 hover:bg-red-500"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
  }];
  return <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      {!isMobile && <PageHeader title="Warranty Management" description="Track warranty periods for items provided to customers" />}

      <div className={!isMobile ? "bg-white rounded-lg border" : ""}>
        <div className="p-0">
          <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
            {!isMobile && <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search warranty items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10" />
              </div>}
          </div>

          {isLoading ? <div className="py-8 text-center bg-slate-100">
              <p className="text-muted-foreground">Loading warranty items...</p>
            </div> : filteredWarrantyItems.length === 0 ? <div className="py-8 text-center">
              <p className="text-muted-foreground">No warranty items found.</p>
            </div> : <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={paginatedData(filteredWarrantyItems)}
                searchKey={"item_name" as never}   // ← cast to satisfy DataTableProps<unknown>
                isLoading={isLoading}
                emptyMessage="No warranty items found."
              />
              {filteredWarrantyItems.length > 0 && <div className="p-4 border-t">
                  <PaginationControls pagination={pagination} controls={controls} />
                </div>}
            </div>}
        </div>
      </div>

      <FloatingActionButton onClick={() => navigate('/add-warranty-item')} />
    </div>;
}