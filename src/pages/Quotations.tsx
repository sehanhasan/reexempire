import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FloatingActionButton } from "@/components/common/FloatingActionButton";
import { FilePlus, Search, MoreHorizontal, FileEdit, Trash2, FileText, Download, Send, Calendar, Clock, Home, AlertCircle, CheckCircle2, XCircle, TimerReset, ChevronRight, ReceiptText } from "lucide-react";
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
      window.location.href = whatsappUrl;
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

      {/* Modern header with stats */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Total</p>
                <p className="text-xl font-bold text-purple-900 mt-1">{filteredQuotations.length}</p>
              </div>
              <div className="p-2 bg-purple-500 rounded-lg">
                <ReceiptText className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Accepted</p>
                <p className="text-xl font-bold text-green-900 mt-1">{filteredQuotations.filter(q => q.status === 'Accepted').length}</p>
              </div>
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Sent</p>
                <p className="text-xl font-bold text-blue-900 mt-1">{filteredQuotations.filter(q => q.status === 'Sent').length}</p>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Send className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Total Value</p>
                <p className="text-lg font-bold text-amber-900 mt-1">{formatMoney(filteredQuotations.reduce((sum, q) => sum + q.total, 0))}</p>
              </div>
              <div className="p-2 bg-amber-500 rounded-lg">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl border shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search quotations..." className="pl-10 h-10 border-slate-200" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          
          <div className="w-full sm:w-60">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 border-slate-200">
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

        {loading ? <div className="py-12 text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-slate-600 font-medium">Loading quotations...</p>
          </div> : filteredQuotations.length === 0 ? <div className="py-12 text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
            <ReceiptText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No quotations found matching your criteria</p>
          </div> : <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              {isMobile ? <div className="p-2 space-y-3">
                  {filteredQuotations.map(quotation => {
              const status = quotation.status;
              return <div key={quotation.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-l-purple-500 mx-3 mb-3" onClick={() => navigate(`/quotations/edit/${quotation.id}`)}>
                        <div className="p-4 border-b border-purple-100 flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-purple-700 text-base">
                              #{quotation.unit_number || "No Unit"}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center mt-1">
                              <FileText className="h-3 w-3 mr-1" />
                              {quotation.reference_number}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge className={`flex items-center ${status === 'Accepted' ? 'bg-green-100 text-green-700 border-green-200' : status === 'Sent' ? 'bg-blue-100 text-blue-700 border-blue-200' : status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' : status === 'Expired' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                              <StatusIcon status={status} />
                              {status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="px-4 py-3 space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 flex items-center font-medium">
                              <Calendar className="h-3.5 w-3.5 mr-2 text-purple-500" />Issue Date
                            </span>
                            <span className="text-slate-700 font-medium">{formatDate(quotation.issue_date)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 flex items-center font-medium">
                              <Clock className="h-3.5 w-3.5 mr-2 text-purple-500" />Expiry Date
                            </span>
                            <span className="text-slate-700 font-medium">{formatDate(quotation.expiry_date)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 flex items-center font-medium">
                              <Home className="h-3.5 w-3.5 mr-2 text-purple-500" />Customer
                            </span>
                            <span className="font-semibold truncate max-w-[150px] text-slate-800">
                              {quotation.customer_name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="border-t border-purple-100 p-3 bg-gradient-to-r from-purple-50 to-pink-50 flex justify-between items-center">
                          <span className="text-lg font-bold text-purple-700">
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
                                Create Invoice
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
      </div>

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