import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        return 'bg-green-100 text-green-800';
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

        {/* Quotations and Invoices Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-cyan-600">Customer Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="quotations" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quotations">
                  <FileText className="mr-2 h-4 w-4" />
                  Quotations ({quotations.length})
                </TabsTrigger>
                <TabsTrigger value="invoices">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Invoices ({invoices.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="quotations" className="mt-4">
                {quotations.length === 0 ? 
                  <p className="text-muted-foreground text-center py-4">No quotations found</p> : 
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotations.map(quotation => 
                          <TableRow key={quotation.id} className="h-10">
                            <TableCell className="font-medium py-1">
                              <button 
                                onClick={() => navigate(`/quotations/edit/${quotation.id}`)}
                                className="text-blue-600 hover:underline cursor-pointer"
                              >
                                {quotation.reference_number}
                              </button>
                            </TableCell>
                            <TableCell>{format(new Date(quotation.issue_date), "MMM dd, yyyy")}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(quotation.status)}>
                                {quotation.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatMoney(quotation.total)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="icon" variant="ghost" onClick={() => window.open(`/quotations/view/${quotation.id}`, '_blank')} title="View">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => navigate(`/quotations/edit/${quotation.id}`)} title="Edit">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                }
              </TabsContent>
              
              <TabsContent value="invoices" className="mt-4">
                {invoices.length === 0 ? 
                  <p className="text-muted-foreground text-center py-4">No invoices found</p> : 
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map(invoice => 
                          <TableRow key={invoice.id} className="h-10">
                            <TableCell className="font-medium py-1">
                              <button 
                                onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                                className="text-blue-600 hover:underline cursor-pointer"
                              >
                                {invoice.reference_number}
                              </button>
                            </TableCell>
                            <TableCell>{format(new Date(invoice.issue_date), "MMM dd, yyyy")}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor((invoice.payment_status === 'Partially Paid') ? 'partial' : (invoice.status === 'Sent' ? 'unpaid' : invoice.status))}>
                                {(invoice.payment_status === 'Partially Paid') ? 'Paid - Partial' : (invoice.status === 'Sent' ? 'Unpaid' : invoice.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatMoney(invoice.total)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="icon" variant="ghost" onClick={() => window.open(`/invoices/view/${invoice.id}`, '_blank')} title="View">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => navigate(`/invoices/edit/${invoice.id}`)} title="Edit">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                }
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>;
}