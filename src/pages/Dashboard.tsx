import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/dashboard/Chart";
import { Users, ReceiptText, CreditCard, Clock, ChevronRight } from "lucide-react";
import { quotationService, invoiceService, customerService, appointmentService } from "@/services";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    customers: 0,
    quotations: 0,
    invoices: 0,
    revenue: 0
  });
  const [upcomingJobs, setUpcomingJobs] = useState([]);
  const [recentQuotations, setRecentQuotations] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [customers, quotations, invoices, appointments] = await Promise.all([customerService.getAll(), quotationService.getAll(), invoiceService.getAll(), appointmentService.getAll()]);

        // Calculate total revenue from invoices
        const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);

        // Set stats
        setStats({
          customers: customers.length,
          quotations: quotations.length,
          invoices: invoices.length,
          revenue: totalRevenue
        });

        // Get upcoming appointments/jobs
        const now = new Date();
        const upcomingAppointments = appointments.filter(appt => new Date(appt.start_time) > now).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).slice(0, 5);

        // We're accessing job.quotation_id which doesn't exist on Appointment type
        // So we'll need to modify this part to use a different approach
        const jobsWithQuotations = await Promise.all(upcomingAppointments.map(async job => {
          // Find quotations related to this customer
          const customerQuotations = quotations.filter(q => q.customer_id === job.customer_id);
          return {
            ...job,
            // Add related quotations if any
            related_quotations: customerQuotations.length ? customerQuotations : []
          };
        }));
        setUpcomingJobs(jobsWithQuotations);

        // Get recent quotations and invoices
        setRecentQuotations(quotations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
        setRecentInvoices(invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
  const formatMoney = amount => {
    return `RM ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };
  const navigateToQuotation = id => {
    navigate(`/quotations/${id}`);
  };
  const navigateToInvoice = id => {
    navigate(`/invoices/${id}`);
  };

  // Sample data for the revenue chart
  const revenueData = [{
    month: "Jan",
    revenue: 12000
  }, {
    month: "Feb",
    revenue: 15000
  }, {
    month: "Mar",
    revenue: 18000
  }, {
    month: "Apr",
    revenue: 16000
  }, {
    month: "May",
    revenue: 21000
  }, {
    month: "Jun",
    revenue: 19000
  }];
  const salesByCategory = [{
    name: "Bathroom",
    value: 35
  }, {
    name: "Kitchen",
    value: 30
  }, {
    name: "Flooring",
    value: 20
  }, {
    name: "Electrical",
    value: 15
  }];
  return <div className="page-container">
      <PageHeader title="Dashboard" description="Overview of your business performance" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard title="Total Customers" value={stats.customers} trend={{
        value: 12,
        isPositive: true
      }} description="vs last month" icon={<Users className="h-4 w-4" />} onClick={() => navigate("/customers")} />
        
        <StatCard title="Active Quotations" value={stats.quotations} trend={{
        value: 4,
        isPositive: true
      }} description="vs last month" icon={<ReceiptText className="h-4 w-4" />} onClick={() => navigate("/quotations")} />
        
        <StatCard title="Invoices Issued" value={stats.invoices} trend={{
        value: 2,
        isPositive: true
      }} description="vs last month" icon={<CreditCard className="h-4 w-4" />} onClick={() => navigate("/invoices")} />
        
        <StatCard title="Total Revenue" value={formatMoney(stats.revenue)} trend={{
        value: 8,
        isPositive: true
      }} description="vs last month" icon={<CreditCard className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Monthly revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart type="bar" data={revenueData} categories={["revenue"]} index="month" colors={["#3b82f6"]} valueFormatter={value => `RM ${value.toLocaleString()}`} height={300} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Jobs</CardTitle>
            <CardDescription>Jobs scheduled in the next few days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingJobs.length === 0 ? <p className="text-center py-10 text-muted-foreground">No upcoming jobs scheduled</p> : <div className="space-y-4">
                {upcomingJobs.map(job => <div key={job.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="font-medium">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(job.start_time), {
                    addSuffix: true
                  })}
                      </p>
                      <p className="text-sm">{job.customer_name}</p>
                    </div>
                    <div className="flex space-x-2">
                      {job.related_quotations && job.related_quotations.length > 0 && <Button variant="outline" size="sm" onClick={() => navigateToQuotation(job.related_quotations[0].id)}>
                          <ReceiptText className="h-4 w-4 mr-1" />
                          Quotation
                        </Button>}
                      <Button variant="outline" size="sm" onClick={() => navigate(`/schedule`)}>
                        <Clock className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Quotations</CardTitle>
              <CardDescription>Recently created quotations</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/quotations")}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentQuotations.length === 0 ? <p className="text-center py-10 text-muted-foreground">No quotations found</p> : <div className="space-y-4">
                {recentQuotations.map(quotation => <div key={quotation.id} className="flex items-center justify-between pb-2 border-b cursor-pointer hover:bg-gray-50 p-2 rounded-md" onClick={() => navigateToQuotation(quotation.id)}>
                    <div>
                      <h3 className="font-medium">{quotation.reference_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(quotation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatMoney(quotation.total)}</p>
                      <p className="text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${quotation.status === 'Approved' ? 'bg-green-100 text-green-800' : quotation.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {quotation.status}
                        </span>
                      </p>
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Recently created invoices</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/invoices")}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? <p className="text-center py-10 text-muted-foreground">No invoices found</p> : <div className="space-y-4">
                {recentInvoices.map(invoice => <div key={invoice.id} className="flex items-center justify-between pb-2 border-b cursor-pointer hover:bg-gray-50 p-2 rounded-md" onClick={() => navigateToInvoice(invoice.id)}>
                    <div>
                      <h3 className="font-medium">{invoice.reference_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatMoney(invoice.total)}</p>
                      <p className="text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${invoice.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : invoice.payment_status === 'Unpaid' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {invoice.payment_status}
                        </span>
                      </p>
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
}