
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Chart } from "@/components/dashboard/Chart";
import { StatCard } from "@/components/dashboard/StatCard";
import { useQuery } from "@tanstack/react-query";
import { appointmentService, customerService, invoiceService } from "@/services";
import { format } from "date-fns";
import { Invoice, Appointment, Customer } from "@/types/database";

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [pendingAppointments, setPendingAppointments] = useState<number>(0);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<
    { name: string; revenue: number }[]
  >([]);

  // Fetch appointments
  const {
    data: appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useQuery({
    queryKey: ["appointments"],
    queryFn: appointmentService.getAll,
  });

  // Fetch invoices
  const {
    data: invoices,
    isLoading: invoicesLoading,
    error: invoicesError,
  } = useQuery({
    queryKey: ["invoices"],
    queryFn: invoiceService.getAll,
  });

  // Fetch customers
  const {
    data: customers,
    isLoading: customersLoading,
    error: customersError,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getAll,
  });

  // Calculate statistics based on data
  useEffect(() => {
    if (invoices && Array.isArray(invoices) && invoices.length > 0) {
      // Calculate total revenue (sum of all invoice totals)
      const revenue = invoices.reduce(
        (sum: number, invoice: Invoice) => sum + Number(invoice.total),
        0
      );
      setTotalRevenue(revenue);

      // Calculate monthly revenue
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const currentYear = new Date().getFullYear();
      
      const monthlyData = months.map((month, index) => {
        const monthInvoices = invoices.filter((invoice: Invoice) => {
          const invoiceDate = new Date(invoice.issue_date);
          return (
            invoiceDate.getMonth() === index && 
            invoiceDate.getFullYear() === currentYear
          );
        });
        
        const monthlyTotal = monthInvoices.reduce(
          (sum: number, invoice: Invoice) => sum + Number(invoice.total),
          0
        );
        
        return {
          name: month,
          revenue: monthlyTotal,
        };
      });
      
      setMonthlyRevenue(monthlyData);
    }
  }, [invoices]);

  useEffect(() => {
    if (appointments && Array.isArray(appointments) && appointments.length > 0) {
      // Calculate pending appointments
      const pending = appointments.filter(
        (appointment: Appointment) => appointment.status === "Pending"
      ).length;
      setPendingAppointments(pending);
    }
  }, [appointments]);

  useEffect(() => {
    if (customers && Array.isArray(customers) && customers.length > 0) {
      // Calculate total customers
      setTotalCustomers(customers.length);
    }
  }, [customers]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          loading={invoicesLoading}
          error={invoicesError}
        />
        <StatCard
          title="Pending Appointments"
          value={pendingAppointments.toString()}
          loading={appointmentsLoading}
          error={appointmentsError}
        />
        <StatCard
          title="Total Customers"
          value={totalCustomers.toString()}
          loading={customersLoading}
          error={customersError}
        />
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} />
            {selectedDate ? (
              <p>
                You selected{" "}
                {format(selectedDate, "PPP")}
                .
              </p>
            ) : (
              <p>Please select a date.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart 
              data={monthlyRevenue} 
              type="bar"
              categories={["revenue"]}
              index="name"
              colors={["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]}
              height={300}
              valueFormatter={(value: number) => `$${value.toFixed(2)}`}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Tabs defaultValue="appointments" className="w-full">
              <TabsList>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
              </TabsList>
              <TabsContent value="appointments">
                {appointmentsLoading ? (
                  <div>Loading appointments...</div>
                ) : appointmentsError ? (
                  <div>Error loading appointments.</div>
                ) : appointments && Array.isArray(appointments) && appointments.length > 0 ? (
                  <ul className="list-none space-y-2">
                    {appointments.slice(0, 5).map((appointment: Appointment) => (
                      <li key={appointment.id} className="border rounded-md p-2">
                        <div className="font-bold">{appointment.title}</div>
                        <div className="text-sm">
                          {format(new Date(appointment.appointment_date), "PPP")}
                        </div>
                        <Badge variant="secondary">{appointment.status}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>No recent appointments.</div>
                )}
              </TabsContent>
              <TabsContent value="invoices">
                {invoicesLoading ? (
                  <div>Loading invoices...</div>
                ) : invoicesError ? (
                  <div>Error loading invoices.</div>
                ) : invoices && Array.isArray(invoices) && invoices.length > 0 ? (
                  <ul className="list-none space-y-2">
                    {invoices.slice(0, 5).map((invoice: Invoice) => (
                      <li key={invoice.id} className="border rounded-md p-2">
                        <div className="font-bold">Invoice #{invoice.reference_number}</div>
                        <div className="text-sm">
                          {format(new Date(invoice.issue_date), "PPP")}
                        </div>
                        <Badge variant="secondary">{invoice.payment_status}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>No recent invoices.</div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
