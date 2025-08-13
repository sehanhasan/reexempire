import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Receipt, Calendar } from "lucide-react";
import { dashboardService, quotationService, invoiceService, appointmentService, customerService } from "@/services";
import { formatDate, formatCurrency } from "@/utils/formatters";
import { Quotation, Invoice, Appointment, Customer } from "@/types/database";

interface RecentQuotation extends Quotation {
  customer_name: string;
}

interface RecentInvoice extends Invoice {
  customer_name: string;
}

interface TodayAppointment extends Appointment {
  customer_name: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalQuotations, setTotalQuotations] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [recentQuotations, setRecentQuotations] = useState<RecentQuotation[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          customers,
          quotations,
          invoices,
          appointments
        ] = await Promise.all([
          customerService.getAll(),
          quotationService.getAll(),
          invoiceService.getAll(),
          appointmentService.getAll()
        ]);

        setTotalCustomers(customers.length);
        setTotalQuotations(quotations.length);
        setTotalInvoices(invoices.length);
        setTotalAppointments(appointments.length);

        // Fetch recent quotations with customer names
        const recentQuotationsData = await quotationService.getAll();
        const recentQuotationsWithCustomerNames = await Promise.all(
          recentQuotationsData.slice(0, 5).map(async (quotation) => {
            const customer = await customerService.getById(quotation.customer_id);
            return {
              ...quotation,
              customer_name: customer?.name || "Unknown Customer",
            };
          })
        );
        setRecentQuotations(recentQuotationsWithCustomerNames);

        // Fetch recent invoices with customer names
        const recentInvoicesData = await invoiceService.getAll();
        const recentInvoicesWithCustomerNames = await Promise.all(
          recentInvoicesData.slice(0, 5).map(async (invoice) => {
            const customer = await customerService.getById(invoice.customer_id);
            return {
              ...invoice,
              customer_name: customer?.name || "Unknown Customer",
            };
          })
        );
        setRecentInvoices(recentInvoicesWithCustomerNames);

        // Fetch today's appointments with customer names
        const today = new Date().toISOString().split('T')[0];
        const todayAppointmentsData = await appointmentService.getTodaysAppointments(today);
        const todayAppointmentsWithCustomerNames = await Promise.all(
          todayAppointmentsData.map(async (appointment) => {
            const customer = await customerService.getById(appointment.customer_id);
            return {
              ...appointment,
              customer_name: customer?.name || "Unknown Customer",
            };
          })
        );
        setTodayAppointments(todayAppointmentsWithCustomerNames);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getQuotationStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'sent':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'expired':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatMoney = (amount: number) => {
    return `RM ${parseFloat(amount.toString()).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return <div className="page-container">
        <PageHeader title="Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>;
  }

  return (
    <div className="page-container">
      <PageHeader title="Dashboard" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalCustomers}</div>
          </CardContent>
        </Card>

        {/* Total Quotations */}
        <Card>
          <CardHeader>
            <CardTitle>Total Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalQuotations}</div>
          </CardContent>
        </Card>

        {/* Total Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalInvoices}</div>
          </CardContent>
        </Card>

        {/* Total Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalAppointments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Recent Quotations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuotations.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No quotations found</p>
            ) : (
              <div className="space-y-3">
                {recentQuotations.map((quotation) => (
                  <div
                    key={quotation.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => navigate(`/quotations/edit/${quotation.id}`)}
                  >
                    <div>
                      <p className="font-medium text-blue-700">#{quotation.reference_number}</p>
                      <p className="text-sm text-blue-600">{quotation.customer_name}</p>
                      <p className="text-xs text-blue-500">{formatDate(quotation.issue_date)}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs mb-1 ${getQuotationStatusBadge(quotation.status)}`}>
                        {quotation.status}
                      </Badge>
                      <p className="text-sm font-semibold text-blue-700">{formatMoney(quotation.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-600" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No invoices found</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                  >
                    <div>
                      <p className="font-medium text-green-700">#{invoice.reference_number}</p>
                      <p className="text-sm text-green-600">{invoice.customer_name}</p>
                      <p className="text-xs text-green-500">{formatDate(invoice.issue_date)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={invoice.payment_status === 'Paid' ? 'default' : 'secondary'} className="text-xs mb-1">
                        {invoice.payment_status}
                      </Badge>
                      <p className="text-sm font-semibold text-green-700">{formatMoney(invoice.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Today's Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No appointments scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => navigate(`/appointments/edit/${appointment.id}`)}
                >
                  <div>
                    <p className="font-medium text-purple-700">{appointment.title}</p>
                    <p className="text-sm text-purple-600">{appointment.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-purple-700">{appointment.start_time} - {appointment.end_time}</p>
                    <Badge variant={appointment.status === 'Completed' ? 'default' : 'secondary'} className="text-xs">
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
