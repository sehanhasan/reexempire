import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/dashboard/Chart";
import { Users, ReceiptText, CreditCard, Clock, ChevronRight, Calendar, Receipt } from "lucide-react";
import { quotationService, invoiceService, customerService, appointmentService } from "@/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetailsDialog";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        console.log("Fetching dashboard data...");
        const [customers, quotations, invoices, appointments] = await Promise.all([
          customerService.getAll(), 
          quotationService.getAll(), 
          invoiceService.getAll(), 
          appointmentService.getAll()
        ]);

        console.log("Fetched appointments:", appointments);

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

        // Fix the date filtering for upcoming appointments
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');
        
        console.log("Today's date:", today);
        console.log("All appointments:", appointments);

        // Filter appointments that are today or in the future and not cancelled/completed
        const upcomingAppts = appointments.filter(appt => {
          const appointmentDate = appt.appointment_date;
          const isUpcoming = appointmentDate >= today;
          const isNotCancelled = appt.status && appt.status.toLowerCase() !== 'cancelled';
          const isNotCompleted = appt.status && appt.status.toLowerCase() !== 'completed';
          
          console.log(`Appointment ${appt.id}: date=${appointmentDate}, upcoming=${isUpcoming}, status=${appt.status}, notCancelled=${isNotCancelled}, notCompleted=${isNotCompleted}`);
          
          return isUpcoming && isNotCancelled && isNotCompleted;
        }).sort((a, b) => {
          // Sort by date first, then by time
          if (a.appointment_date !== b.appointment_date) {
            return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
          }
          return a.start_time.localeCompare(b.start_time);
        }).slice(0, 5);

        console.log("Filtered upcoming appointments:", upcomingAppts);

        const enhancedAppointments = upcomingAppts.map(appointment => {
          const customer = customersMapData[appointment.customer_id] || {};
          return {
            ...appointment,
            customer_name: customer.name || "Unknown Customer",
            unit_number: customer.unit_number || ""
          };
        });
        
        console.log("Enhanced appointments:", enhancedAppointments);
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

  const renderActivityTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg text-cyan-600">Upcoming Appointments</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/schedule")}>
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? <div className="py-4 text-center text-sm text-gray-500">Loading appointments...</div> : upcomingAppointments.length === 0 ? <div className="py-4 text-center text-sm text-gray-500">No upcoming appointments scheduled</div> : <div className="space-y-4">
            {upcomingAppointments.map(appointment => <div key={appointment.id} className="flex items-center justify-between border-b pb-3 cursor-pointer hover:bg-gray-50 rounded-md p-2" onClick={() => showAppointmentDetails(appointment)}>
              <div className="w-full">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-base">
                    {appointment.unit_number ? `#${appointment.unit_number} - ` : ""}
                    {appointment.title}
                  </h3>
                  <Badge className={
                    appointment.status.toLowerCase() === "confirmed" || appointment.status.toLowerCase() === "scheduled" ? "bg-blue-500 text-white" : 
                    appointment.status.toLowerCase() === "completed" ? "bg-green-500 text-white" : 
                    appointment.status.toLowerCase() === "in progress" ? "bg-yellow-500 text-white" :
                    appointment.status.toLowerCase() === "cancelled" ? "bg-red-500 text-white" : 
                    "bg-gray-500 text-white"
                  }>
                    {appointment.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(appointment.appointment_date).toLocaleDateString()} 
                  {' • '}
                  {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                </p>
              </div>
            </div>)}
          </div>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-cyan-600">Recent Quotations</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/quotations")}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentQuotations.length === 0 ? <p className="text-center py-10 text-muted-foreground">No quotations found</p> : <div className="space-y-4">
              {recentQuotations.map(quotation => {
                const customer = customersMap[quotation.customer_id] || {};
                return (
                  <div key={quotation.id} className="flex items-center justify-between pb-2 border-b cursor-pointer hover:bg-gray-50 p-2 rounded-md" onClick={() => navigateToQuotation(quotation.id)}>
                    <div>
                      <h3 className="font-medium">
                        {customer.unit_number ? `#${customer.unit_number}` : "No Unit"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {quotation.reference_number} • {new Date(quotation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatMoney(quotation.total)}</p>
                      <Badge className={
                        quotation.status === 'Approved' ? "bg-green-500 text-white" : 
                        quotation.status === 'Sent' ? "bg-blue-500 text-white" : 
                        quotation.status === 'Draft' ? "bg-gray-500 text-white" : 
                        "bg-green-500 text-white"
                      }>
                        {quotation.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-cyan-600">Recent Invoices</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/invoices")}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? <p className="text-center py-10 text-muted-foreground">No invoices found</p> : <div className="space-y-4">
              {recentInvoices.map(invoice => {
                const customer = customersMap[invoice.customer_id] || {};
                return (
                  <div key={invoice.id} className="flex items-center justify-between pb-2 border-b cursor-pointer hover:bg-gray-50 p-2 rounded-md" onClick={() => navigateToInvoice(invoice.id)}>
                    <div>
                      <h3 className="font-medium">
                        {customer.unit_number ? `#${customer.unit_number}` : "No Unit"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {invoice.reference_number} • {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatMoney(invoice.total)}</p>
                      <Badge className={
                        invoice.payment_status === 'Paid' ? "bg-green-500 text-white" : 
                        invoice.payment_status === 'Unpaid' ? "bg-red-500 text-white" : 
                        "bg-yellow-500 text-white"
                      }>
                        {invoice.payment_status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
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
        }} description="vs last month" icon={<Receipt className="h-4 w-4" />} onClick={() => navigate("/invoices")} />
      </div>
    </div>
  );

  const renderRevenueTab = () => (
    <div className="space-y-6">
      <StatCard title="Total Revenue" value={formatMoney(stats.revenue)} trend={{
        value: 8,
        isPositive: true
      }} description="vs last month" icon={<CreditCard className="h-4 w-4" />} />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-cyan-600">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <Chart 
            chartData={revenueData} 
            categories={["revenue"]} 
            index="month" 
            colors={["#3b82f6"]} 
            valueFormatter={value => `RM ${value.toLocaleString()}`} 
            height={300} 
            title=""
          />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader title="Dashboard" description="" />

      {isMobile ? (
        <div className="mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="mt-4">
              {renderActivityTab()}
            </TabsContent>
            <TabsContent value="revenue" className="mt-4">
              {renderRevenueTab()}
            </TabsContent>
            <TabsContent value="overview" className="mt-4">
              {renderOverviewTab()}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg text-cyan-600">Upcoming Appointments</CardTitle>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate("/schedule")}>
                        View All
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {loading ? <div className="py-4 text-center text-sm text-gray-500">Loading appointments...</div> : upcomingAppointments.length === 0 ? <div className="py-4 text-center text-sm text-gray-500">No upcoming appointments scheduled</div> : <div className="space-y-4">
                          {upcomingAppointments.map(appointment => <div key={appointment.id} className="flex items-center justify-between border-b pb-3 cursor-pointer hover:bg-gray-50 rounded-md p-2" onClick={() => showAppointmentDetails(appointment)}>
                              <div className="w-full">
                                <div className="flex justify-between items-start mb-1">
                                  <h3 className="font-medium text-base">
                                    {appointment.unit_number ? `#${appointment.unit_number} - ` : ""}
                                    {appointment.title}
                                  </h3>
                                  <Badge className={
                                    appointment.status.toLowerCase() === "confirmed" || appointment.status.toLowerCase() === "scheduled" ? "bg-blue-500 text-white" : 
                                    appointment.status.toLowerCase() === "completed" ? "bg-green-500 text-white" : 
                                    appointment.status.toLowerCase() === "in progress" ? "bg-yellow-500 text-white" :
                                    appointment.status.toLowerCase() === "cancelled" ? "bg-red-500 text-white" : 
                                    "bg-gray-500 text-white"
                                  }>
                                    {appointment.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {new Date(appointment.appointment_date).toLocaleDateString()} 
                                  {' • '}
                                  {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                                </p>
                              </div>
                            </div>)}
                        </div>}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg text-cyan-600">Recent Quotations</CardTitle>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate("/quotations")}>
                          View All
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {recentQuotations.length === 0 ? <p className="text-center py-3 text-muted-foreground">No quotations found</p> : <div className="space-y-3">
                            {recentQuotations.slice(0, 3).map(quotation => {
                              const customer = customersMap[quotation.customer_id] || {};
                              return (
                                <div key={quotation.id} className="flex items-center justify-between pb-2 border-b cursor-pointer hover:bg-gray-50 p-2 rounded-md" onClick={() => navigateToQuotation(quotation.id)}>
                                  <div>
                                    <h3 className="font-medium">
                                      {customer.unit_number ? `#${customer.unit_number}` : "No Unit"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {quotation.reference_number} • {new Date(quotation.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatMoney(quotation.total)}</p>
                                    <Badge className={
                                      quotation.status === 'Approved' ? "bg-green-500 text-white" : 
                                      quotation.status === 'Sent' ? "bg-blue-500 text-white" : 
                                      quotation.status === 'Draft' ? "bg-gray-500 text-white" : 
                                      "bg-green-500 text-white"
                                    }>
                                      {quotation.status}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg text-cyan-600">Recent Invoices</CardTitle>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate("/invoices")}>
                          View All
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {recentInvoices.length === 0 ? <p className="text-center py-3 text-muted-foreground">No invoices found</p> : <div className="space-y-3">
                            {recentInvoices.slice(0, 3).map(invoice => {
                              const customer = customersMap[invoice.customer_id] || {};
                              return (
                                <div key={invoice.id} className="flex items-center justify-between pb-2 border-b cursor-pointer hover:bg-gray-50 p-2 rounded-md" onClick={() => navigateToInvoice(invoice.id)}>
                                  <div>
                                    <h3 className="font-medium">
                                      {customer.unit_number ? `#${customer.unit_number}` : "No Unit"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {invoice.reference_number} • {new Date(invoice.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatMoney(invoice.total)}</p>
                                    <Badge className={
                                      invoice.payment_status === 'Paid' ? "bg-green-500 text-white" : 
                                      invoice.payment_status === 'Unpaid' ? "bg-red-500 text-white" : 
                                      "bg-yellow-500 text-white"
                                    }>
                                      {invoice.payment_status}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="revenue" className="mt-6">
                {renderRevenueTab()}
              </TabsContent>
              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-3 gap-4">
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
                  }} description="vs last month" icon={<Receipt className="h-4 w-4" />} onClick={() => navigate("/invoices")} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      <AppointmentDetailsDialog 
        open={isAppointmentDetailOpen} 
        onClose={() => setIsAppointmentDetailOpen(false)} 
        appointment={selectedAppointment} 
        customer={selectedAppointment ? customersMap[selectedAppointment.customer_id] : null} 
        assignedStaff={null}
        onMarkAsCompleted={async (appointment) => {
          try {
            await appointmentService.update(appointment.id, {
              ...appointment,
              status: 'Completed'
            });
            
            setUpcomingAppointments(prev => 
              prev.map(app => app.id === appointment.id 
                ? { ...app, status: 'Completed' } 
                : app
              )
            );
            setIsAppointmentDetailOpen(false);
          } catch (error) {
            console.error("Error marking appointment as completed:", error);
          }
        }}
        onMarkAsInProgress={async (appointment) => {
          try {
            await appointmentService.update(appointment.id, {
              ...appointment,
              status: 'In Progress'
            });
            
            setUpcomingAppointments(prev => 
              prev.map(app => app.id === appointment.id 
                ? { ...app, status: 'In Progress' } 
                : app
              )
            );
            setIsAppointmentDetailOpen(false);
          } catch (error) {
            console.error("Error marking appointment as in progress:", error);
          }
        }}
      />
    </div>
  );
}
