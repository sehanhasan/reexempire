
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { FilePlus, Search, MoreHorizontal, FileEdit, Trash2, AlertTriangle, FileCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { invoiceService, customerService } from "@/services";
import { formatDate } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Invoices() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customers, setCustomers] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch invoices
      const invoiceData = await invoiceService.getAll();
      setInvoices(invoiceData);
      
      // Fetch customers for mapping
      const customerData = await customerService.getAll();
      const customerMap = {};
      customerData.forEach(customer => {
        customerMap[customer.id] = customer;
      });
      setCustomers(customerMap);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter invoices based on search term and status filter
  useEffect(() => {
    let filtered = [...invoices];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => 
        invoice.payment_status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.reference_number?.toLowerCase().includes(search) ||
        customers[invoice.customer_id]?.name?.toLowerCase().includes(search) ||
        formatDate(invoice.issue_date)?.toLowerCase().includes(search)
      );
    }
    
    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter, customers]);

  const columns = [
    {
      header: "Invoice #",
      accessorKey: "reference_number",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.reference_number}</div>
      ),
    },
    {
      header: "Customer",
      accessorKey: "customer_id",
      cell: ({ row }) => (
        <div>{customers[row.original.customer_id]?.name || "Unknown"}</div>
      ),
    },
    {
      header: "Date",
      accessorKey: "issue_date",
      cell: ({ row }) => <div>{formatDate(row.original.issue_date)}</div>,
    },
    {
      header: "Due Date",
      accessorKey: "due_date",
      cell: ({ row }) => <div>{formatDate(row.original.due_date)}</div>,
    },
    {
      header: "Status",
      accessorKey: "payment_status",
      cell: ({ row }) => {
        const status = row.original.payment_status;
        let statusColor = "bg-gray-100 text-gray-800";
        
        if (status === "Paid") {
          statusColor = "bg-green-100 text-green-800";
        } else if (status === "Partially Paid") {
          statusColor = "bg-blue-100 text-blue-800";
        } else if (status === "Overdue") {
          statusColor = "bg-red-100 text-red-800";
        }
        
        return (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {status}
          </div>
        );
      },
    },
    {
      header: "Total",
      accessorKey: "total",
      cell: ({ row }) => (
        <div className="text-right font-medium">
          RM {Number(row.original.total).toFixed(2)}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/invoices/edit/${row.original.id}`)}>
                <FileEdit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setInvoiceToDelete(row.original);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    
    try {
      await invoiceService.delete(invoiceToDelete.id);
      
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceToDelete.id));
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete the invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Invoices"
        actions={
          <Button onClick={() => navigate("/invoices/create")}>
            <FilePlus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        }
      />

      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search invoices..."
                className="pl-8 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-60">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partially paid">Partially Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredInvoices}
            isLoading={loading}
            emptyMessage="No invoices found. Create your first invoice to get started."
          />
        </CardContent>
      </Card>

      <FloatingActionButton
        icon={<FilePlus className="h-5 w-5" />}
        onClick={() => navigate("/invoices/create")}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice{" "}
              <span className="font-medium">
                {invoiceToDelete?.reference_number}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
