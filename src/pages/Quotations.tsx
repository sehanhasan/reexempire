
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { FilePlus, Search, MoreHorizontal, FileEdit, Trash2, FileText, Download, Send } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { quotationService, customerService } from "@/services";
import { formatDate } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { Quotation, Customer } from "@/types/database";
import { generateQuotationPDF, downloadPDF } from "@/utils/pdfGenerator";

// Extended type for quotations with customer name
interface QuotationWithCustomer extends Quotation {
  customer_name: string;
  unit_number?: string;
}

export default function Quotations() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [quotations, setQuotations] = useState<QuotationWithCustomer[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<QuotationWithCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [quotationData, customerData] = await Promise.all([
        quotationService.getAll(),
        customerService.getAll()
      ]);
      
      // Create a lookup map for customers
      const customerMap: Record<string, Customer> = {};
      customerData.forEach(customer => {
        customerMap[customer.id] = customer;
      });
      setCustomers(customerMap);
      
      // Combine quotation data with customer names
      const enhancedQuotations: QuotationWithCustomer[] = quotationData.map(quotation => ({
        ...quotation,
        customer_name: customerMap[quotation.customer_id]?.name || "Unknown Customer",
        unit_number: customerMap[quotation.customer_id]?.unit_number
      }));
      
      setQuotations(enhancedQuotations);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to load quotations. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...quotations];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(quotation => quotation.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(quotation => 
        quotation.reference_number.toLowerCase().includes(search) || 
        quotation.customer_name.toLowerCase().includes(search) || 
        formatDate(quotation.issue_date).toLowerCase().includes(search) ||
        (quotation.unit_number && quotation.unit_number.toLowerCase().includes(search))
      );
    }
    
    setFilteredQuotations(filtered);
  }, [quotations, searchTerm, statusFilter]);
  
  const handleDelete = async () => {
    if (!quotationToDelete) return;
    try {
      await quotationService.delete(quotationToDelete.id);
      setQuotations(quotations.filter(quotation => quotation.id !== quotationToDelete.id));
      setDeleteDialogOpen(false);
      setQuotationToDelete(null);
      toast({
        title: "Quotation Deleted",
        description: "The quotation has been deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to delete the quotation. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleConvertToInvoice = (quotation: QuotationWithCustomer) => {
    navigate("/invoices/create", { state: { quotationId: quotation.id } });
  };
  
  const handleSendWhatsapp = (quotation: QuotationWithCustomer) => {
    const customer = customers[quotation.customer_id];
    
    if (!customer) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format phone number (remove any non-digit characters)
      let phoneNumber = customer.phone?.replace(/\D/g, '') || '';
      
      if (!phoneNumber) {
        toast({
          title: "Missing Phone Number",
          description: "Customer doesn't have a phone number for WhatsApp.",
          variant: "destructive",
        });
        return;
      }
      
      // Make sure phone number starts with country code
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '6' + phoneNumber; // Adding Malaysia country code
      } else if (!phoneNumber.startsWith('6')) {
        phoneNumber = '60' + phoneNumber;
      }
      
      // WhatsApp message text
      const message = `Dear ${customer.name},\n\nPlease find attached Quotation ${quotation.reference_number} valid until ${formatDate(quotation.expiry_date)}.\n\nThank you.\nStar Residences Management`;
      
      // Open WhatsApp web with the prepared message
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
      
      // Update quotation status to "Sent" when sending via WhatsApp
      if (quotation.status === "Draft") {
        quotationService.update(quotation.id, { status: "Sent" }).then(updatedQuotation => {
          setQuotations(quotations.map(q => 
            q.id === quotation.id ? {...updatedQuotation, customer_name: q.customer_name, unit_number: q.unit_number} : q
          ));
          
          toast({
            title: "Status Updated",
            description: "Quotation status has been updated to Sent",
          });
        });
      }
      
      toast({
        title: "WhatsApp Opened",
        description: "WhatsApp has been opened with the quotation message. The document PDF will need to be attached manually.",
      });
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDownloadPDF = (quotation: QuotationWithCustomer) => {
    const customer = customers[quotation.customer_id];
    
    if (!customer) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdf = generateQuotationPDF({
        documentNumber: quotation.reference_number,
        documentDate: quotation.issue_date,
        customerName: customer.name,
        unitNumber: customer.unit_number || "",
        expiryDate: quotation.expiry_date,
        validUntil: quotation.expiry_date,
        notes: quotation.notes || "",
        items: [], // We would need to fetch the items for this quotation
        depositInfo: {
          requiresDeposit: quotation.requires_deposit || false,
          depositAmount: quotation.deposit_amount || 0,
          depositPercentage: quotation.deposit_percentage || 0
        }
      });
      
      downloadPDF(pdf, `Quotation_${quotation.reference_number}_${customer.name.replace(/\s+/g, '_')}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Quotation PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const columns = [
    {
      header: "Quotation #",
      accessorKey: "reference_number",
      cell: ({ row }: { row: { original: QuotationWithCustomer } }) => (
        <Button 
          variant="link" 
          className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
          onClick={() => navigate(`/quotations/edit/${row.original.id}`)}
        >
          {row.original.reference_number}
        </Button>
      )
    },
    {
      header: "Customer",
      accessorKey: "customer_name",
      cell: ({ row }: { row: { original: QuotationWithCustomer } }) => (
        <div>{row.original.customer_name}</div>
      )
    },
    {
      header: "Unit #",
      accessorKey: "unit_number",
      cell: ({ row }: { row: { original: QuotationWithCustomer } }) => (
        <div>{row.original.unit_number || "-"}</div>
      )
    },
    {
      header: "Amount",
      accessorKey: "total",
      cell: ({ row }: { row: { original: QuotationWithCustomer } }) => (
        <div className="text-right font-medium">
          RM {Number(row.original.total).toFixed(2)}
        </div>
      )
    },
    {
      header: "Date",
      accessorKey: "issue_date",
      cell: ({ row }: { row: { original: QuotationWithCustomer } }) => (
        <div>{formatDate(row.original.issue_date)}</div>
      )
    },
    {
      header: "Valid Until",
      accessorKey: "expiry_date",
      cell: ({ row }: { row: { original: QuotationWithCustomer } }) => (
        <div>{formatDate(row.original.expiry_date)}</div>
      )
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: { row: { original: QuotationWithCustomer } }) => {
        const status = row.original.status;
        let statusColor = "bg-gray-100 text-gray-800";
        
        if (status === "Draft") {
          statusColor = "bg-gray-100 text-gray-800";
        } else if (status === "Sent") {
          statusColor = "bg-blue-100 text-blue-800";
        } else if (status === "Accepted") {
          statusColor = "bg-green-100 text-green-800";
        } else if (status === "Rejected") {
          statusColor = "bg-red-100 text-red-800";
        } else if (status === "Expired") {
          statusColor = "bg-amber-100 text-amber-800";
        }
        
        return (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {status}
          </div>
        );
      }
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: { row: { original: QuotationWithCustomer } }) => (
        <div className="flex justify-end space-x-1">
          {row.original.status === "Accepted" && (
            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8 text-blue-600" 
              title="Convert to Invoice"
              onClick={() => handleConvertToInvoice(row.original)}
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8" 
            title="Send on WhatsApp"
            onClick={() => handleSendWhatsapp(row.original)}
          >
            <Send className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8" 
            title="Download PDF"
            onClick={() => handleDownloadPDF(row.original)}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/quotations/edit/${row.original.id}`)}>
                <FileEdit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={() => {
                  setQuotationToDelete(row.original);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Quotations" 
        actions={
          <div className="hidden md:block">
            <Button onClick={() => navigate("/quotations/create")}>
              <FilePlus className="mr-2 h-4 w-4" />
              Create Quotation
            </Button>
          </div>
        }
      />

      <Card className="mt-6">
        <CardHeader className="pb-2">
          
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                type="search" 
                placeholder="Search quotations..." 
                className="pl-8 h-10" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            
            <div className="w-full md:w-60">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable 
            columns={columns} 
            data={filteredQuotations} 
            isLoading={loading} 
            emptyMessage="No quotations found. Create your first quotation to get started." 
          />
        </CardContent>
      </Card>

      <FloatingActionButton 
        icon={<FilePlus className="h-5 w-5" />} 
        onClick={() => navigate("/quotations/create")} 
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete quotation{" "}
              <span className="font-medium">
                {quotationToDelete?.reference_number}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
