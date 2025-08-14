
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Chart } from "@/components/dashboard/Chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Users, Calendar, DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { quotationService, invoiceService, customerService, appointmentService } from "@/services";
import { format } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalQuotations: 0,
    totalInvoices: 0,
    totalAppointments: 0,
  });
  const [recentQuotations, setRecentQuotations] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [customers, quotations, invoices, appointments] = await Promise.all([
          customerService.getAll(),
          quotationService.getAll(),
          invoiceService.getAll(),
          appointmentService.getAll(),
        ]);

        setStats({
          totalCustomers: customers?.length || 0,
          totalQuotations: quotations?.length || 0,
          totalInvoices: invoices?.length || 0,
          totalAppointments: appointments?.length || 0,
        });

        setRecentQuotations(quotations?.slice(0, 5) || []);
        setRecentInvoices(invoices?.slice(0, 5) || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'draft';
      case 'sent': return 'sent';
      case 'accepted': return 'accepted';
      case 'rejected': return 'rejected';
      case 'paid': return 'paid';
      case 'unpaid': return 'unpaid';  
      case 'overdue': return 'overdue';
      case 'partially paid': return 'pending';
      default: return 'draft';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string, dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (paymentStatus === 'Paid') return 'paid';
    if (paymentStatus === 'Partially Paid') return 'pending';
    if (due < today && paymentStatus === 'Unpaid') return 'overdue';
    return 'unpaid';
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageHeader title="Dashboard" />
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader title="Dashboard" />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Customers"
          icon={<Users className="h-6 w-6" />}
          trend={{ value: stats.totalCustomers, isPositive: true }}
        />
        <StatCard
          title="Total Quotations"
          icon={<FileText className="h-6 w-6" />}
          trend={{ value: stats.totalQuotations, isPositive: true }}
        />
        <StatCard
          title="Total Invoices"
          icon={<DollarSign className="h-6 w-6" />}
          trend={{ value: stats.totalInvoices, isPositive: true }}
        />
        <StatCard
          title="Total Appointments"
          icon={<Calendar className="h-6 w-6" />}
          trend={{ value: stats.totalAppointments, isPositive: true }}
        />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <Chart 
          title="Monthly Overview"
          chartData={[
            { month: 'Jan', quotations: 10, invoices: 8 },
            { month: 'Feb', quotations: 15, invoices: 12 },
            { month: 'Mar', quotations: 20, invoices: 18 },
            { month: 'Apr', quotations: 12, invoices: 10 },
            { month: 'May', quotations: 25, invoices: 22 },
            { month: 'Jun', quotations: 18, invoices: 15 }
          ]}
          categories={['quotations', 'invoices']}
          index="month"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Quotations
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/quotations")}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentQuotations.length > 0 ? (
                recentQuotations.map((quotation: any) => (
                  <div
                    key={quotation.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => navigate(`/quotations/view/${quotation.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{quotation.reference_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(quotation.issue_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(quotation.status)}>
                        {quotation.status}
                      </Badge>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No quotations yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Invoices
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/invoices")}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((invoice: any) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => navigate(`/invoices/view/${invoice.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{invoice.reference_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(invoice.issue_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPaymentStatusColor(invoice.payment_status, invoice.due_date)}>
                        {new Date(invoice.due_date) < new Date() && invoice.payment_status === 'Unpaid' 
                          ? 'Overdue' 
                          : invoice.payment_status}
                      </Badge>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No invoices yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
