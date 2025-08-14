
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Chart } from "@/components/dashboard/Chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  FileText, 
  DollarSign, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye
} from "lucide-react";
import { customerService, quotationService, invoiceService, appointmentService } from "@/services";
import { Customer, Quotation, Invoice, Appointment } from "@/types/database";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalQuotations: 0,
    totalInvoices: 0,
    totalAppointments: 0,
    pendingQuotations: 0,
    unpaidInvoices: 0,
    todayAppointments: 0
  });
  
  const [recentQuotations, setRecentQuotations] = useState<Quotation[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [customers, quotations, invoices, appointments] = await Promise.all([
          customerService.getAll(),
          quotationService.getAll(),
          invoiceService.getAll(),
          appointmentService.getAll()
        ]);

        const today = new Date().toISOString().split('T')[0];
        
        // Update invoice statuses based on due dates
        const updatedInvoices = invoices.map(invoice => {
          if (invoice.payment_status === 'Unpaid' && invoice.due_date < today) {
            return { ...invoice, payment_status: 'Overdue' };
          }
          return invoice;
        });

        setStats({
          totalCustomers: customers.length,
          totalQuotations: quotations.length,
          totalInvoices: invoices.length,
          totalAppointments: appointments.length,
          pendingQuotations: quotations.filter(q => q.status === 'Sent').length,
          unpaidInvoices: updatedInvoices.filter(i => i.payment_status === 'Unpaid' || i.payment_status === 'Overdue').length,
          todayAppointments: appointments.filter(a => a.appointment_date === today).length
        });

        setRecentQuotations(quotations.slice(0, 5));
        setRecentInvoices(updatedInvoices.slice(0, 5));
        setUpcomingAppointments(
          appointments
            .filter(a => new Date(a.appointment_date) >= new Date())
            .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
            .slice(0, 5)
        );

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string, type: 'quotation' | 'invoice' | 'appointment') => {
    const statusLower = status.toLowerCase();
    
    if (type === 'quotation') {
      switch (statusLower) {
        case 'draft': return <Badge variant="draft">{status}</Badge>;
        case 'sent': return <Badge variant="sent">{status}</Badge>;
        case 'accepted': return <Badge variant="accepted">{status}</Badge>;
        case 'rejected': return <Badge variant="rejected">{status}</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
      }
    }
    
    if (type === 'invoice') {
      switch (statusLower) {
        case 'paid': return <Badge variant="paid">{status}</Badge>;
        case 'unpaid': return <Badge variant="unpaid">{status}</Badge>;
        case 'overdue': return <Badge variant="overdue">{status}</Badge>;
        case 'partial': return <Badge variant="pending">{status}</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
      }
    }
    
    if (type === 'appointment') {
      switch (statusLower) {
        case 'scheduled': return <Badge variant="scheduled">{status}</Badge>;
        case 'completed': return <Badge variant="completed">{status}</Badge>;
        case 'cancelled': return <Badge variant="cancelled">{status}</Badge>;
        case 'in progress': return <Badge variant="inprogress">{status}</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
      }
    }
    
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Dashboard" description="Overview of your business operations." />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader title="Dashboard" description="Overview of your business operations." />
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-2">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Quotations"
          value={stats.pendingQuotations}
          icon={<FileText className="h-4 w-4" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Unpaid Invoices"
          value={stats.unpaidInvoices}
          icon={<DollarSign className="h-4 w-4" />}
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={<Calendar className="h-4 w-4" />}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Chart 
              title="Revenue"
              chartData={[]}
              categories={[]}
              index=""
            />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <div className="ml-2 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Invoice paid
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                <div className="ml-2 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    New quotation sent
                  </p>
                  <p className="text-sm text-muted-foreground">
                    4 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                <div className="ml-2 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Payment overdue
                  </p>
                  <p className="text-sm text-muted-foreground">
                    1 day ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items Grid */}
      <div className="grid gap-6 md:grid-cols-3 mt-6">
        {/* Recent Quotations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Quotations</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/quotations")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuotations.map((quotation) => (
                <div key={quotation.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="text-sm font-medium">{quotation.reference_number}</p>
                      <p className="text-xs text-muted-foreground">
                        ${quotation.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(quotation.status, 'quotation')}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/quotations/view/${quotation.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="text-sm font-medium">{invoice.reference_number}</p>
                      <p className="text-xs text-muted-foreground">
                        ${invoice.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(invoice.payment_status, 'invoice')}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/invoices/view/${invoice.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/schedule")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="text-sm font-medium">{appointment.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.appointment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(appointment.status, 'appointment')}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/schedule`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
