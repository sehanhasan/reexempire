import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { customerService, invoiceService } from "@/services";
import { formatDate } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";


export default function Warranty() {
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch warranty items
  const { data: warrantyItems = [], isLoading } = useQuery({
    queryKey: ['warranty-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warranty_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch customers and invoices
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceService.getAll
  });


  // Delete warranty item mutation
  const deleteWarrantyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('warranty_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranty-items'] });
      toast({
        title: "Success",
        description: "Warranty item deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete warranty item",
        variant: "destructive",
      });
    }
  });

  // Filter warranty items based on search
  const filteredWarrantyItems = warrantyItems.filter(item => {
    if (!searchTerm) return true;
    
    const customer = customers.find(c => c.id === item.customer_id);
    const invoice = invoices.find(i => i.id === item.invoice_id);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      item.item_name.toLowerCase().includes(searchLower) ||
      item.serial_number?.toLowerCase().includes(searchLower) ||
      customer?.name.toLowerCase().includes(searchLower) ||
      customer?.unit_number?.toLowerCase().includes(searchLower) ||
      invoice?.reference_number.toLowerCase().includes(searchLower)
    );
  });

  const getWarrantyStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'Expired', variant: 'destructive' as const };
    if (daysUntilExpiry <= 30) return { status: 'Expiring Soon', variant: 'secondary' as const };
    return { status: 'Active', variant: 'default' as const };
  };

  const columns = [
    {
      accessorKey: "item_name",
      header: "Item Name",
      cell: ({ getValue }: any) => (
        <span className="font-medium">{getValue()}</span>
      )
    },
    {
      accessorKey: "serial_number",
      header: "Serial #",
      cell: ({ getValue }: any) => (
        <span className="font-mono text-sm">{getValue() || '-'}</span>
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
      accessorKey: "invoice_id",
      header: "Invoice #",
      cell: ({ getValue }: any) => {
        const invoice = invoices.find(i => i.id === getValue());
        return (
          <span className="font-mono text-sm">
            {invoice?.reference_number || '-'}
          </span>
        );
      }
    },
    {
      accessorKey: "issue_date",
      header: "Issue Date",
      cell: ({ getValue }: any) => formatDate(getValue())
    },
    {
      accessorKey: "expiry_date",
      header: "Expiry Date",
      cell: ({ getValue }: any) => {
        const { status, variant } = getWarrantyStatus(getValue());
        return (
          <div>
            <div>{formatDate(getValue())}</div>
            <Badge variant={variant} className="mt-1">
              {status}
            </Badge>
          </div>
        );
      }
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteWarrantyMutation.mutate(row.original.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }
  ];


  return (
    <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      <PageHeader
        title="Warranty Management"
        description="Track warranty periods for items provided to customers"
      />


      {/* Main Content */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg text-cyan-600">Warranty Items</CardTitle>
            <Button onClick={() => navigate('/add-warranty-item')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Warranty Items
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by item name, serial #, customer, or invoice #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredWarrantyItems}
            searchKey="item_name"
            isLoading={isLoading}
            emptyMessage="No warranty items found."
          />
        </CardContent>
      </Card>
    </div>
  );
}