import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/dashboard/Chart";
import { Users, ReceiptText, CreditCard, Clock, ChevronRight, Calendar, Receipt, TrendingUp, Activity, DollarSign } from "lucide-react";
import { quotationService, invoiceService, customerService, appointmentService } from "@/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetailsDialog";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
export default function Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({
    customers: 0,
    quotations: 0,
    invoices: 0,
    revenue: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentQuotations, setRecentQuotations] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customersMap, setCustomersMap] = useState({});
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isAppointmentDetailOpen, setIsAppointmentDetailOpen] = useState(false);
  const [revenueData, setRevenueData] = useState([]);
  const [activeTab, setActiveTab] = useState("activity");
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [customers, quotations, invoices, appointments] = await Promise.all([customerService.getAll(), quotationService.getAll(), invoiceService.getAll(), appointmentService.getAll()]);
        const customersMapData = {};
        customers.forEach(customer => {
          customersMapData[customer.id] = customer;
        });
        setCustomersMap(customersMapData);
        const paidInvoices = invoices.filter(invoice => invoice.payment_status === 'Paid');
        const totalRevenue = paidInvoices.reduce((acc, invoice) => {
          const numAcc = typeof acc === 'number' ? acc : 0;
          let invoiceTotal = 0;
          if (typeof invoice.total === 'number') {
            invoiceTotal = invoice.total;
          } else if (invoice.total !== null && invoice.total !== undefined) {
            const parsed = Number(invoice.total);
            invoiceTotal = isNaN(parsed) ? 0 : parsed;
          }
          return numAcc + invoiceTotal;
        }, 0);
        setStats({
          customers: customers.length,
          quotations: quotations.length,
          invoices: invoices.length,
          revenue: totalRevenue
        });
        const revenueByMonth = generateRevenueByMonth(paidInvoices);
        setRevenueData(revenueByMonth);

        // Filter upcoming appointments (not completed, not cancelled)
        const today = new Date().toISOString().split('T')[0];
        const upcomingAppts = appointments.filter(appt => {
          const appointmentDate = appt.appointment_date;
          const isUpcoming = appointmentDate >= today;
          const isNotCancelled = appt.status !== 'Cancelled';
          const isNotCompleted = appt.status !== 'Completed';
          return isUpcoming && isNotCancelled && isNotCompleted;
        });

        // Group appointments by customer and add customer info
        const enhancedAppointments = upcomingAppts.slice(0, 5) // Show only the first 5 appointments
        .map(appointment => ({
          ...appointment,
          customer: customersMapData[appointment.customer_id]
        }));
        setUpcomingAppointments(enhancedAppointments);
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
  const formatTime = time => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };
  const generateRevenueByMonth = paidInvoices => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      const monthName = format(monthStart, 'MMM');
      const monthlyRevenue = paidInvoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issue_date);
        return invoiceDate >= monthStart && invoiceDate <= monthEnd;
      }).reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
      data.push({
        month: monthName,
        revenue: monthlyRevenue
      });
    }
    return data;
  };
  const navigateToQuotation = id => {
    navigate(`/quotations/edit/${id}`);
  };
  const navigateToInvoice = id => {
    navigate(`/invoices/edit/${id}`);
  };
  const showAppointmentDetails = appointment => {
    setSelectedAppointment(appointment);
    setIsAppointmentDetailOpen(true);
  };
  const navigateToEditAppointment = id => {
    navigate(`/schedule/edit/${id}`);
  };
  const renderOverviewTab = () => <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Customers</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.customers}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600 font-medium">+12%</span>
              </div>
            </div>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Quotations</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{stats.quotations}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600 font-medium">+4%</span>
              </div>
            </div>
            <div className="p-2 bg-purple-500 rounded-lg">
              <ReceiptText className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Invoices</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.invoices}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600 font-medium">+2%</span>
              </div>
            </div>
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Receipt className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Revenue</p>
              <p className="text-xl font-bold text-amber-900 mt-1">{formatMoney(stats.revenue)}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600 font-medium">+8%</span>
              </div>
            </div>
            <div className="p-2 bg-amber-500 rounded-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-slate-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">Revenue Trend</CardTitle>
              <CardDescription className="text-sm text-slate-600">Last 6 months performance</CardDescription>
            </div>
            <div className="p-2 bg-slate-600 rounded-lg">
              <Activity className="h-4 w-4 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Chart chartData={revenueData} categories={["revenue"]} index="month" colors={["#3b82f6"]} valueFormatter={value => `RM ${value.toLocaleString()}`} height={200} title="" />
        </CardContent>
      </Card>
    </div>;
  const renderActivityTab = () => <div className="space-y-4">
      {/* Upcoming Appointments */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">Appointments</CardTitle>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/schedule")} className="text-blue-600 hover:text-blue-700">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-slate-600 mt-2">Loading appointments...</p>
            </div> : upcomingAppointments.length === 0 ? <div className="py-8 text-center">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">No upcoming appointments</p>
            </div> : <div className="space-y-3">
              {upcomingAppointments.map(appointment => <div key={appointment.id} onClick={() => showAppointmentDetails(appointment)} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all cursor-pointer">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {appointment.customer?.unit_number ? <span className="text-blue-700">#{appointment.customer.unit_number}</span> : ""}{appointment.customer?.unit_number ? " - " : ""}
                        <span className="text-slate-800">{appointment.title}</span>
                      </h3>
                      <Badge className={appointment.status.toLowerCase() === "confirmed" || appointment.status.toLowerCase() === "scheduled" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : appointment.status.toLowerCase() === "completed" ? "bg-green-100 text-green-700 hover:bg-green-100" : appointment.status.toLowerCase() === "in progress" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"} variant="secondary">
                        {appointment.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-500">
                        {new Date(appointment.appointment_date).toLocaleDateString()}
                      </span>
                      {' • '}
                      <span className="text-emerald-600 font-medium">
                        {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                      </span>
                    </p>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {/* Recent Activities Grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Recent Quotations */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ReceiptText className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">Quotations</CardTitle>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/quotations")} className="text-purple-600 hover:text-purple-700">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {recentQuotations.length === 0 ? <div className="py-8 text-center">
                <ReceiptText className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">No quotations found</p>
              </div> : <div className="space-y-3">
                {recentQuotations.slice(0, 3).map(quotation => {
              const customer = customersMap[quotation.customer_id] || {};
              return <div key={quotation.id} onClick={() => navigateToQuotation(quotation.id)} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-all cursor-pointer ">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">
                          <span className="text-purple-700">
                            {customer.unit_number ? `#${customer.unit_number}` : "No Unit"}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-600">
                          <span className="font-medium text-slate-500">{quotation.reference_number}</span>
                          {' • '}
                          <span className="text-slate-500">{new Date(quotation.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-slate-800">{formatMoney(quotation.total)}</p>
                        <Badge className={quotation.status === 'Approved' ? "bg-green-100 text-green-700 hover:bg-green-100" : quotation.status === 'Sent' ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"} variant="secondary">
                          {quotation.status}
                        </Badge>
                      </div>
                    </div>;
            })}
              </div>}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Receipt className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">Invoices</CardTitle>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")} className="text-emerald-600 hover:text-emerald-700">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {recentInvoices.length === 0 ? <div className="py-8 text-center">
                <Receipt className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">No invoices found</p>
              </div> : <div className="space-y-3">
                {recentInvoices.slice(0, 3).map(invoice => {
              const customer = customersMap[invoice.customer_id] || {};
              return <div key={invoice.id} onClick={() => navigateToInvoice(invoice.id)} className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-all cursor-pointer">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">
                          <span className="text-emerald-700">
                            {customer.unit_number ? `#${customer.unit_number}` : "No Unit"}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-600">
                          <span className="font-medium text-slate-500">{invoice.reference_number}</span>
                          {' • '}
                          <span className="text-slate-500">{new Date(invoice.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-slate-800">{formatMoney(invoice.total)}</p>
                        <Badge className={invoice.payment_status === 'Paid' ? "bg-green-100 text-green-700 hover:bg-green-100" : invoice.payment_status === 'Unpaid' ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"} variant="secondary">
                          {invoice.payment_status}
                        </Badge>
                      </div>
                    </div>;
            })}
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
  return <div className="page-container min-h-screen bg-slate-50">
      <div className="p-2">

        {/* Modern Tab Navigation */}
        <div className="mb-4">
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
            <button onClick={() => setActiveTab("activity")} className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === "activity" ? "bg-blue-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"}`}>
              Activity
            </button>
            <button onClick={() => setActiveTab("overview")} className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === "overview" ? "bg-blue-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"}`}>
              Overview
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === "activity" && renderActivityTab()}
          {activeTab === "overview" && renderOverviewTab()}
        </div>
      </div>

      {/* Keep existing AppointmentDetailsDialog */}
      <AppointmentDetailsDialog open={isAppointmentDetailOpen} onClose={() => setIsAppointmentDetailOpen(false)} appointment={selectedAppointment} customer={selectedAppointment ? customersMap[selectedAppointment.customer_id] : null} assignedStaff={null} onMarkAsCompleted={async appointment => {
      try {
        await appointmentService.update(appointment.id, {
          ...appointment,
          status: 'Completed'
        });
        setUpcomingAppointments(prev => prev.map(app => app.id === appointment.id ? {
          ...app,
          status: 'Completed'
        } : app));
        setIsAppointmentDetailOpen(false);
      } catch (error) {
        console.error("Error marking appointment as completed:", error);
      }
    }} onMarkAsInProgress={async appointment => {
      try {
        await appointmentService.update(appointment.id, {
          ...appointment,
          status: 'In Progress'
        });
        setUpcomingAppointments(prev => prev.map(app => app.id === appointment.id ? {
          ...app,
          status: 'In Progress'
        } : app));
        setIsAppointmentDetailOpen(false);
      } catch (error) {
        console.error("Error marking appointment as in progress:", error);
      }
    }} />
    </div>;
}