
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/dashboard/Chart";
import { Users, ReceiptText, CreditCard, Clock, ChevronRight, Calendar, Receipt } from "lucide-react";
import { quotationService, invoiceService, customerService, appointmentService } from "@/services";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";

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

        // Calculate total revenue from invoices - ensure we're working with numbers
        const totalRevenue = invoices.reduce((sum, invoice) => {
          let invoiceTotal = 0;
          
          if (invoice.total !== undefined && invoice.total !== null) {
            if (typeof invoice.total === 'string') {
              const parsed = parseFloat(invoice.total);
              if (!isNaN(parsed)) {
                invoiceTotal = parsed;
              }
            } else if (typeof invoice.total === 'number') {
              invoiceTotal = invoice.total;
            }
          }
          
          // Explicitly convert both operands to numbers and ensure they're valid
          const numericSum = typeof sum === 'number' ? sum : 0;
          const numericInvoiceTotal = typeof invoiceTotal === 'number' ? invoiceTotal : 0;
          
          return numericSum + numericInvoiceTotal;
        }, 0);

        // Set stats
        setStats({
          customers: customers.length,
          quotations: quotations.length,
          invoices: invoices.length,
          revenue: totalRevenue
        });

        // Get upcoming appointments/jobs
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
    navigate(`/quotations/${id}`);
  };
  
  const navigateToInvoice = id => {
    navigate(`/invoices/${id}`);
  };
  
  const navigateToAppointment = id => {
    navigate(`/schedule`);
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
      }} description="vs last month" icon={<Receipt className="h-4 w-4" />} onClick={() => navigate("/invoices")} />
        
        <StatCard title="Total Revenue" value={formatMoney(stats.revenue)} trend={{
        value: 8,
        isPositive: true
      }} description="vs last month" icon={<CreditCard className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            
          </CardHeader>
          <CardContent>
            <Chart type="bar" data={revenueData} categories={["revenue"]} index="month" colors={["#3b82f6"]} valueFormatter={value => `RM ${value.toLocaleString()}`} height={300} />
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
                    onClick={() => navigateToAppointment(appointment.id)}
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
                    <Button variant="outline" size="sm" className="flex-shrink-0">
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
    </div>;
}
