
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Chart } from "@/components/dashboard/Chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, FileText, Users, TrendingUp, Clock } from "lucide-react";
import { quotationService, invoiceService, customerService, appointmentService } from "@/services";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardStats {
  totalQuotations: number;
  totalInvoices: number;
  totalCustomers: number;
  totalAppointments: number;
  monthlyRevenue: number;
  pendingQuotations: number;
}

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotations: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalAppointments: 0,
    monthlyRevenue: 0,
    pendingQuotations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [quotations, invoices, customers, appointments] = await Promise.all([
        quotationService.getAll(),
        invoiceService.getAll(),
        customerService.getAll(),
        appointmentService.getAll()
      ]);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date);
        return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
      });

      const monthlyRevenue = monthlyInvoices.reduce((total, invoice) => {
        return total + (invoice.total_amount || 0);
      }, 0);

      const pendingQuotations = quotations.filter(q => q.status === 'pending').length;

      setStats({
        totalQuotations: quotations.length,
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalAppointments: appointments.length,
        monthlyRevenue,
        pendingQuotations
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Jan', revenue: 4000, quotations: 24 },
    { name: 'Feb', revenue: 3000, quotations: 18 },
    { name: 'Mar', revenue: 5000, quotations: 32 },
    { name: 'Apr', revenue: 4500, quotations: 28 },
    { name: 'May', revenue: 6000, quotations: 35 },
    { name: 'Jun', revenue: 5500, quotations: 30 },
  ];

  const recentActivities = [
    { id: 1, action: "New quotation created", customer: "John Doe", time: "2 hours ago", type: "quotation" },
    { id: 2, action: "Invoice paid", customer: "ABC Company", time: "4 hours ago", type: "payment" },
    { id: 3, action: "Appointment scheduled", customer: "Jane Smith", time: "6 hours ago", type: "appointment" },
    { id: 4, action: "New customer added", customer: "XYZ Corp", time: "1 day ago", type: "customer" },
    { id: 5, action: "Quotation approved", customer: "Bob Wilson", time: "2 days ago", type: "quotation" },
  ];

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Dashboard</h1>
        </div>
        <Tabs defaultValue="overview" className="w-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Quotations"
              value={stats.totalQuotations.toString()}
              description={`${stats.pendingQuotations} pending`}
              icon={FileText}
              loading={loading}
            />
            <StatCard
              title="Total Invoices"
              value={stats.totalInvoices.toString()}
              description="This month"
              icon={DollarSign}
              loading={loading}
            />
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers.toString()}
              description="Active customers"
              icon={Users}
              loading={loading}
            />
            <StatCard
              title="Appointments"
              value={stats.totalAppointments.toString()}
              description="Scheduled"
              icon={Calendar}
              loading={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <Chart data={chartData} />
            </div>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates from your business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {activity.customer}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-xs text-gray-400">
                        {activity.time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Monthly Revenue"
              value={`RM ${stats.monthlyRevenue.toLocaleString()}`}
              description="Current month"
              icon={TrendingUp}
              loading={loading}
            />
            <StatCard
              title="Average Invoice"
              value={`RM ${stats.totalInvoices > 0 ? (stats.monthlyRevenue / stats.totalInvoices).toFixed(2) : '0'}`}
              description="This month"
              icon={DollarSign}
              loading={loading}
            />
            <StatCard
              title="Pending Amount"
              value="RM 0"
              description="Awaiting payment"
              icon={Clock}
              loading={loading}
            />
          </div>
          <Chart data={chartData} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Detailed view of recent business activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Customer: {activity.customer}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
