import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, FileText, Eye, Edit, DollarSign, Loader2 } from "lucide-react";
import { customerService, quotationService, invoiceService } from "@/services";
import { Customer } from "@/types/database";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
export default function CustomerHistory() {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);

        // Fetch customer data
        const customerData = await customerService.getById(id);
        setCustomer(customerData);

        // Fetch quotations and invoices
        const [allQuotations, allInvoices] = await Promise.all([quotationService.getAll(), invoiceService.getAll()]);

        // Filter by customer ID
        const customerQuotations = allQuotations?.filter(q => q.customer_id === id) || [];
        const customerInvoices = allInvoices?.filter(i => i.customer_id === id) || [];
        setQuotations(customerQuotations);
        setInvoices(customerInvoices);
      } catch (error) {
        console.error("Error fetching customer history:", error);
        toast({
          title: "Error",
          description: "Failed to load customer history. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-amber-100 text-amber-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partially paid':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const formatMoney = (amount: number) => `RM ${parseFloat(amount.toString()).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
  if (isLoading) {
    return <div className="page-container flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading customer history...</span>
      </div>;
  }
  if (!customer) {
    return <div className="page-container">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Customer not found</h2>
          <Button onClick={() => navigate("/customers")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </div>
      </div>;
  }
  return <div className="page-container">
      <PageHeader title={`Customer History`} description="View all quotations and invoices for this customer" />

      <div className="mt-6 space-y-6">
        {/* Customer Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-cyan-600">Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{customer.name}</p>
              </div>
              {customer.unit_number && <div>
                  <p className="text-sm text-muted-foreground">Unit Number</p>
                  <p className="font-medium">{customer.unit_number}</p>
                </div>}
              {customer.phone && <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>}
              {customer.email && <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Quotations and Invoices */}
        <div className="space-y-6">
          <div className="bg-white border-b">
            <nav className="flex space-x-8">
              <button
                className="py-4 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600"
                data-tab="quotations"
                onClick={() => {
                  const invoicesTab = document.getElementById('invoices-tab');
                  const quotationsTab = document.getElementById('quotations-tab');
                  if (invoicesTab && quotationsTab) {
                    quotationsTab.classList.remove('hidden');
                    invoicesTab.classList.add('hidden');
                    document.querySelector('[data-tab="quotations"]')?.classList.add('border-blue-500', 'text-blue-600');
                    document.querySelector('[data-tab="quotations"]')?.classList.remove('border-transparent', 'text-gray-500');
                    document.querySelector('[data-tab="invoices"]')?.classList.remove('border-blue-500', 'text-blue-600');
                    document.querySelector('[data-tab="invoices"]')?.classList.add('border-transparent', 'text-gray-500');
                  }
                }}
              >
                Quotations ({quotations.length})
              </button>
              <button
                className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700"
                onClick={() => {
                  const invoicesTab = document.getElementById('invoices-tab');
                  const quotationsTab = document.getElementById('quotations-tab');
                  if (invoicesTab && quotationsTab) {
                    invoicesTab.classList.remove('hidden');
                    quotationsTab.classList.add('hidden');
                    document.querySelector('[data-tab="invoices"]')?.classList.add('border-blue-500', 'text-blue-600');
                    document.querySelector('[data-tab="invoices"]')?.classList.remove('border-transparent', 'text-gray-500');
                    document.querySelector('[data-tab="quotations"]')?.classList.remove('border-blue-500', 'text-blue-600');
                    document.querySelector('[data-tab="quotations"]')?.classList.add('border-transparent', 'text-gray-500');
                  }
                }}
                data-tab="invoices"
              >
                Invoices ({invoices.length})
              </button>
            </nav>
          </div>

          {/* Quotations Tab */}
          <Card id="quotations-tab">
            <CardContent>
              {quotations.length === 0 ? <p className="text-muted-foreground text-center py-4">No quotations found</p> : <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="h-8">
                        <TableHead className="py-2">Reference</TableHead>
                        <TableHead className="py-2">Date</TableHead>
                        <TableHead className="py-2">Status</TableHead>
                        <TableHead className="py-2">Total</TableHead>
                        <TableHead className="w-[100px] py-2">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations.map(quotation => <TableRow key={quotation.id} className="h-8">
                          <TableCell className="font-medium py-1">
                            <button 
                              onClick={() => window.open(`/quotations/view/${quotation.id}`, '_blank')}
                              className="text-blue-600 hover:underline cursor-pointer"
                            >
                              {quotation.reference_number}
                            </button>
                          </TableCell>
                          <TableCell className="py-1">{format(new Date(quotation.issue_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="py-1">
                            <Badge className={getStatusColor(quotation.status)}>
                              {quotation.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1">{formatMoney(quotation.total)}</TableCell>
                          <TableCell className="py-1">
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => window.open(`/quotations/view/${quotation.id}`, '_blank')} title="View" className="h-6 w-6">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => navigate(`/quotations/edit/${quotation.id}`)} title="Edit" className="h-6 w-6">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>}
            </CardContent>
          </Card>

          {/* Invoices Tab */}
          <Card id="invoices-tab" className="hidden">
            <CardContent>
              {invoices.length === 0 ? <p className="text-muted-foreground text-center py-4">No invoices found</p> : <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="h-8">
                        <TableHead className="py-2">Reference</TableHead>
                        <TableHead className="py-2">Date</TableHead>
                        <TableHead className="py-2">Status</TableHead>
                        <TableHead className="py-2">Total</TableHead>
                        <TableHead className="w-[100px] py-2">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map(invoice => <TableRow key={invoice.id} className="h-8">
                          <TableCell className="font-medium py-1">
                            <button 
                              onClick={() => navigate(`/invoices/view/${invoice.id}`)}
                              className="text-blue-600 hover:underline cursor-pointer"
                            >
                              {invoice.reference_number}
                            </button>
                          </TableCell>
                          <TableCell className="py-1">{format(new Date(invoice.issue_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="py-1">
                            <Badge className={getStatusColor((invoice.payment_status === 'Partially Paid') ? 'partial' : (invoice.status === 'Sent' ? 'unpaid' : invoice.status))}>
                              {(invoice.payment_status === 'Partially Paid') ? 'Partial' : (invoice.status === 'Sent' ? 'Unpaid' : invoice.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1">{formatMoney(invoice.total)}</TableCell>
                          <TableCell className="py-1">
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => navigate(`/invoices/view/${invoice.id}`)} title="View" className="h-6 w-6">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => navigate(`/invoices/edit/${invoice.id}`)} title="Edit" className="h-6 w-6">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>}
            </CardContent>
          </Card>
        </div>

        <script>
          {`
            // Add click handlers for tabs
            document.addEventListener('DOMContentLoaded', function() {
              const quotationsBtn = document.querySelector('[data-tab="quotations"]');
              const invoicesBtn = document.querySelector('[data-tab="invoices"]');
              const quotationsTab = document.getElementById('quotations-tab');
              const invoicesTab = document.getElementById('invoices-tab');
              
              if (quotationsBtn) {
                quotationsBtn.addEventListener('click', function() {
                  quotationsTab?.classList.remove('hidden');
                  invoicesTab?.classList.add('hidden');
                  quotationsBtn.classList.add('border-blue-500', 'text-blue-600');
                  quotationsBtn.classList.remove('border-transparent', 'text-gray-500');
                  invoicesBtn?.classList.remove('border-blue-500', 'text-blue-600');
                  invoicesBtn?.classList.add('border-transparent', 'text-gray-500');
                });
              }
            });
          `}
        </script>
      </div>
    </div>;
}