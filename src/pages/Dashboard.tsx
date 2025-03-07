import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/dashboard/Chart";
import { Users, ReceiptText, CreditCard, Clock, ChevronRight, Calendar, Receipt, Plus } from "lucide-react";
import { quotationService, invoiceService, customerService, appointmentService } from "@/services";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetailsDialog";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [customers, quotations, invoices, appointments] = await Promise.all([
          customerService.getAll(), 
          quotationService.getAll(), 
          invoiceService.getAll(), 
          appointmentService.getAll()
        ]);

        // Create customers map for easy lookup
        const customersMapData = {};
        customers.forEach(customer => {
          customersMapData[customer.id] = customer;
        });
        setCustomersMap(customersMapData);

        // Calculate total revenue from paid invoices only
        const paidInvoices = invoices.filter(invoice => invoice.payment_status === 'Paid');
        const totalRevenue = paidInvoices.reduce((acc, invoice) => {
          // Explicitly convert the accumulator to a number to avoid type errors
          const numAcc = typeof acc === 'number' ? acc : 0;
          
          // Handle invoice.total - ensuring it's a valid number
          let invoiceTotal = 0;
          if (typeof invoice.total === 'number') {
            invoiceTotal = invoice.total;
          } else if (invoice.total !== null && invoice.total !== undefined) {
            // Convert the value to a number
            const parsed = Number(invoice.total);
            invoiceTotal = isNaN(parsed) ? 0 : parsed;
          }
          
          // Return the sum as a number
          return numAcc + invoiceTotal;
        }, 0);

        // Set stats
        setStats({
          customers: customers.length,
          quotations: quotations.length,
          invoices: invoices.length,
          revenue: totalRevenue
        });

        // Generate revenue data for the past 6 months
        const revenueByMonth = generateRevenueByMonth(paidInvoices);
        setRevenueData(revenueByMonth);

        // Get upcoming appointments/jobs - only future appointments
        const now = new Date();
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        
        // Filter appointments that are today or in the future
        const upcomingAppts = appointments
          .filter(appt => appt.appointment_date >= today)
          .sort((a, b) => {
            // Sort by date, then by start time
            if (a.appointment_date !== b.appointment_date) {
              return new Date(a.appointment_date) - new Date(b.appointment_date);
            }
            return a.start_time.localeCompare(b.start_time);
          })
          .slice(0, 5);
        
        // Enhance appointments with customer data
        const enhancedAppointments = upcomingAppts.map(appointment => {
          const customer = customersMapData[appointment.customer_id] || {};
          return {
            ...appointment,
            customer_name: customer.name || "Unknown Customer",
            unit_number: customer.unit_number || ""
          };
        });
        
        setUpcomingAppointments(enhancedAppointments);

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

  const generateRevenueByMonth = (paidInvoices) => {
    const data = [];
    
    // Generate data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      const monthName = format(monthStart, 'MMM');
      
      // Calculate revenue for the month
      const monthlyRevenue = paidInvoices
        .filter(invoice => {
          const invoiceDate = new Date(invoice.issue_date);
          return invoiceDate >= monthStart && invoiceDate <= monthEnd;
        })
        .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
      
      data.push({
        month: monthName,
        revenue: monthlyRevenue
      });
    }
    
    return data;
  };

  const formatMoney = amount => {
    return `RM ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
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

  return (
    <div className="page-container">
      <PageHeader title="Dashboard" description="Overview of your business performance" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard 
          title="Total Customers" 
          value={stats.customers} 
          trend={{
            value: 12,
            isPositive: true
          }} 
          description="vs last month" 
          icon={<Users className="h-4 w-4" />} 
          onClick={() => navigate("/customers")} 
        />
        
        <StatCard 
          title="Active Quotations" 
          value={stats.quotations} 
          trend={{
            value: 4,
            isPositive: true
          }} 
          description="vs last month" 
          icon={<ReceiptText className="h-4 w-4" />} 
          onClick={() => navigate("/quotations")} 
        />
        
        <StatCard 
          title="Invoices Issued" 
          value={stats.invoices} 
          trend={{
            value: 2,
            isPositive: true
          }} 
          description="vs last month" 
          icon={<Receipt className="h-4 w-4" />} 
          onClick={() => navigate("/invoices")} 
        />
        
        <StatCard 
          title="Total Revenue" 
          value={formatMoney(stats.revenue)} 
          trend={{
            value: 8,
            isPositive: true
          }} 
          description="vs last month" 
          icon={<CreditCard className="h-4 w-4" />} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart 
              type="bar" 
              data={revenueData} 
              categories={["revenue"]} 
              index="month" 
              colors={["#3b82f6"]} 
              valueFormatter={value => `RM ${value.toLocaleString()}`} 
              height={300} 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/schedule")}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-4 text-center text-sm text-gray-500">Loading appointments...</div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">No upcoming appointments scheduled</div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map(appointment => (
                  <div 
                    key={appointment.id} 
                    className="flex items-center justify-between border-b pb-3 cursor-pointer hover:bg-gray-50 rounded-md p-2"
                    onClick={() => showAppointmentDetails(appointment)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {appointment.unit_number ? `#${appointment.unit_number} - ` : ""}
                          {appointment.title}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {appointment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(appointment.appointment_date).toLocaleDateString()} 
                        {' • '}
                        {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                      </p>
                      <p className="text-sm">{appointment.customer_name}</p>
                    </div>
                    <Button variant="outline" size="sm" className="flex-shrink-0" onClick={(e) => {
                      e.stopPropagation();
                      showAppointmentDetails(appointment);
                    }}>
                      <Calendar className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Quotations</CardTitle>
              
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

      <AppointmentDetailsDialog
        open={isAppointmentDetailOpen}
        onClose={() => setIsAppointmentDetailOpen(false)}
        appointment={selectedAppointment}
        customer={selectedAppointment ? customersMap[selectedAppointment.customer_id] : null}
        assignedStaff={null}
      />
    </div>
  );
}
