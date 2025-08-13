import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { FilePlus, Search, MoreHorizontal, FileEdit, Trash2, FileText, Download, Send, Calendar, Clock, Home, AlertCircle, CheckCircle2, XCircle, TimerReset, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { quotationService, customerService } from "@/services";
import { formatDate } from "@/utils/formatters";
import { Quotation, Customer } from "@/types/database";
import { generateQuotationPDF, downloadPDF } from "@/utils/pdfGenerator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
interface QuotationWithCustomer extends Quotation {
  customer_name: string;
  unit_number?: string;
}
const StatusBadge = ({
  status
}: {
  status: string;
}) => {
  let bgColor, textColor;
  switch (status) {
    case 'Draft':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-700';
      break;
    case 'Sent':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-700';
      break;
    case 'Accepted':
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
      break;
    case 'Rejected':
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      break;
    case 'Expired':
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-700';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-700';
  }
  return <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${bgColor} ${textColor}`}>
      {status}
    </span>;
};
const StatusIcon = ({
  status
}: {
  status: string;
}) => {
  switch (status) {
    case 'Draft':
      return <AlertCircle className="h-3.5 w-3.5 mr-1 text-gray-500" />;
    case 'Sent':
      return <Send className="h-3.5 w-3.5 mr-1 text-blue-600" />;
    case 'Accepted':
      return <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-600" />;
    case 'Rejected':
      return <XCircle className="h-3.5 w-3.5 mr-1 text-red-600" />;
    case 'Expired':
      return <TimerReset className="h-3.5 w-3.5 mr-1 text-amber-600" />;
    default:
      return <AlertCircle className="h-3.5 w-3.5 mr-1 text-gray-500" />;
  }
};
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
      const [quotationData, customerData] = await Promise.all([quotationService.getAll(), customerService.getAll()]);
      const customerMap: Record<string, Customer> = {};
      customerData.forEach(customer => {
        customerMap[customer.id] = customer;
      });
      setCustomers(customerMap);
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
    if (statusFilter !== "all") {
      filtered = filtered.filter(quotation => quotation.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(quotation => quotation.reference_number.toLowerCase().includes(search) || quotation.customer_name.toLowerCase().includes(search) || formatDate(quotation.issue_date).toLowerCase().includes(search) || quotation.unit_number && quotation.unit_number.toLowerCase().includes(search));
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
        description: "The quotation has been deleted successfully.",
        variant: "destructive"
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
    navigate("/invoices/create", {
      state: {
        quotationId: quotation.id
      }
    });
  };
  const handleSendWhatsapp = (quotation: QuotationWithCustomer) => {
    const customer = customers[quotation.customer_id];
    if (!customer) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive"
      });
      return;
    }
    try {
      const quotationViewUrl = `${window.location.origin}/quotations/view/${quotation.id}`;
      const whatsappUrl = quotationService.generateWhatsAppShareUrl(quotation.id, quotation.reference_number, customer.name, quotationViewUrl);
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Error",
        description: "Failed to open WhatsApp. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleDownloadPDF = async (quotation: QuotationWithCustomer) => {
    const customer = customers[quotation.customer_id];
    if (!customer) {
      toast({
        title: "Missing Information",
        description: "Customer information not found.",
        variant: "destructive"
      });
      return;
    }
    try {
      const quotationItems = await quotationService.getItemsByQuotationId(quotation.id);
      const itemsForPDF = quotationItems.map(item => ({
        id: Number(item.id),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: item.amount,
        category: item.category || '',
        unit: item.unit || ''
      }));
      const pdf = generateQuotationPDF({
        documentNumber: quotation.reference_number,
        documentDate: quotation.issue_date,
        customerName: customer.name,
        unitNumber: customer.unit_number || "",
        expiryDate: quotation.expiry_date,
        validUntil: quotation.expiry_date,
        notes: quotation.notes || "",
        items: itemsForPDF,
        subject: quotation.subject || "",
        customerAddress: customer.address || "",
        customerContact: customer.phone || "",
        customerEmail: customer.email || "",
        depositInfo: {
          requiresDeposit: quotation.requires_deposit || false,
          depositAmount: quotation.deposit_amount || 0,
          depositPercentage: quotation.deposit_percentage || 0
        }
      });
      downloadPDF(pdf, `Quotation_${quotation.reference_number}_${customer.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };
  const formatMoney = (amount: number) => {
    return `RM ${parseFloat(amount.toString()).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Set up mobile search
  useEffect(() => {
    const mobileSearchEvent = new CustomEvent('setup-mobile-search', {
      detail: {
        searchTerm,
        onSearchChange: setSearchTerm,
        placeholder: "Search quotations..."
      }
    });
    window.dispatchEvent(mobileSearchEvent);

    // Clear search when leaving the page
    return () => {
      window.dispatchEvent(new CustomEvent('clear-mobile-search'));
    };
  }, [searchTerm]);
  return <div className="page-container">
      <PageHeader title="Quotations" actions={<div className="hidden md:block"></div>} />

        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search quotations..." className="pl-10 h-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="w-full sm:w-60">
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

          {loading ? <div className="py-8 text-center bg-slate-100">
              <p className="text-muted-foreground">Loading quotations...</p>
            </div> : filteredQuotations.length === 0 ? <div className="py-8 text-center">
              <p className="text-muted-foreground">No quotations found matching your criteria</p>
            </div> : <div className="overflow-x-auto">
              {isMobile ? <div className="p-2 space-y-3">
                  {filteredQuotations.map(quotation => {
              const status = quotation.status;
              return <div key={quotation.id} className="mobile-card border-l-4 border-l-blue-500 rounded-md shadow-sm" onClick={() => navigate(`/quotations/edit/${quotation.id}`)}>
                        <div className="p-3 border-b bg-blue-50/30 flex justify-between items-center">
                          <div>
                            <div className="font-medium text-blue-700">
                              {quotation.unit_number || "-"}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                              <FileText className="h-3 w-3 mr-1" />
                              {quotation.reference_number}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge className={`flex items-center ${status === 'Accepted' ? 'bg-green-100 text-green-700' : status === 'Sent' ? 'bg-blue-100 text-blue-700' : status === 'Rejected' ? 'bg-red-100 text-red-700' : status === 'Expired' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                              <StatusIcon status={status} />
                              {status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="px-3 py-2 space-y-1.5">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5" />Issue Date
                            </span>
                            <span className="text-inherit">{formatDate(quotation.issue_date)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5" />Expiry Date
                            </span>
                            <span>{formatDate(quotation.expiry_date)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center">
                              <Home className="h-3.5 w-3.5 mr-1.5" />Customer
                            </span>
                            <span className="font-medium truncate max-w-[150px]">
                              {quotation.customer_name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="border-t p-2 bg-gray-50 flex justify-between items-center">
                          <span className="text-sm font-semibold text-blue-700">
                            {formatMoney(quotation.total)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* <DropdownMenuItem onClick={e => {
                        e.stopPropagation();
                        navigate(`/quotations/edit/${quotation.id}`);
                      }}>
                                <FileEdit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem> */}
                              <DropdownMenuItem onClick={e => {
                        e.stopPropagation();
                        handleSendWhatsapp(quotation);
                      }}>
                                <Send className="mr-2 h-4 w-4" />
                                Send via WhatsApp
                              </DropdownMenuItem>
                              {/* <DropdownMenuItem onClick={e => {
                        e.stopPropagation();
                        handleDownloadPDF(quotation);
                      }}>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem> */}
                              <DropdownMenuItem onClick={e => {
                        e.stopPropagation();
                        handleConvertToInvoice(quotation);
                      }}>
                                <FileText className="mr-2 h-4 w-4" />
                                Convert to Invoice
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={e => {
                        e.stopPropagation();
                        setQuotationToDelete(quotation);
                        setDeleteDialogOpen(true);
                      }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>;
            })}
                </div> : <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quotation #</TableHead>
                      <TableHead>Unit #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuotations.map(quotation => {
                const status = quotation.status;
                return <TableRow key={quotation.id}>
                          <TableCell>
                            <div className="font-medium cursor-pointer text-blue-600" onClick={() => navigate(`/quotations/edit/${quotation.id}`)}>
                              {quotation.reference_number}
                            </div>
                          </TableCell>
                          <TableCell>{quotation.unit_number || "-"}</TableCell>
                          <TableCell>{formatDate(quotation.issue_date)}</TableCell>
                          <TableCell>{formatDate(quotation.expiry_date)}</TableCell>
                          <TableCell>
                            <StatusBadge status={status} />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMoney(quotation.total)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {/* <DropdownMenuItem onClick={() => navigate(`/quotations/edit/${quotation.id}`)}>
                                  <FileEdit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem> */}
                                <DropdownMenuItem onClick={() => handleSendWhatsapp(quotation)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send via WhatsApp
                                </DropdownMenuItem>
                                {/* <DropdownMenuItem onClick={() => handleDownloadPDF(quotation)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </DropdownMenuItem> */}
                                <DropdownMenuItem onClick={() => handleConvertToInvoice(quotation)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Convert to Invoice
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => {
                          setQuotationToDelete(quotation);
                          setDeleteDialogOpen(true);
                        }}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>;
              })}
                  </TableBody>
                </Table>}
            </div>}
        </CardContent>

      <FloatingActionButton onClick={() => navigate("/quotations/create")} />

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
    </div>;
}