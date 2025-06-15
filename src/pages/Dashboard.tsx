import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CreditCard, BookOpenCheck, FileText, User2, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { customerService, quotationService, invoiceService, staffService, appointmentService } from "@/services";
import { Customer, Quotation, Invoice, Staff, Appointment } from "@/types/database";
import { formatDate } from "@/utils/formatters";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign } from "lucide-react";

interface CardProps {
  title: string;
  amount: string;
  description: string;
  Icon: React.ComponentType<any>;
}

const data: CardProps[] = [
  {
    title: "Total Revenue",
    amount: "$45,231.89",
    description: "Last month revenue was $42,424.76",
    Icon: CreditCard,
  },
  {
    title: "New Customers",
    amount: "350",
    description: "Last month there were 320 new customers",
    Icon: User2,
  },
  {
    title: "Total Staff",
    amount: "12",
    description: "You have 12 staff members",
    Icon: Users2,
  },
  {
    title: "Total Appointments",
    amount: "54",
    description: "You have 54 appointments this month",
    Icon: CalendarIcon,
  },
];

const Dashboard = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersData, quotationsData, invoicesData, staffData, appointmentsData] = await Promise.all([
          customerService.getAll(),
          quotationService.getAll(),
          invoiceService.getAll(),
          staffService.getAll(),
          appointmentService.getAll()
        ]);
        setCustomers(customersData);
        setQuotations(quotationsData);
        setInvoices(invoicesData);
        setStaff(staffData);
        setAppointments(appointmentsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="w-full">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.Icon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.amount}</div>
              <p className="text-sm text-gray-500">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 mt-4">
          <CardHeader>
            <CardTitle>Recent Customers</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 pr-2">
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <div className="list-none p-2">
                {customers.slice(0, 5).map((customer) => (
                  <li key={customer.id} className="mb-2 border-b pb-2 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/customers`}>
                          <p className="text-sm font-medium leading-none">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        </Link>
                      </div>
                      <div className="flex items-center">
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                    </div>
                  </li>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="col-span-1 mt-4">
          <CardHeader>
            <CardTitle>Recent Quotations</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 pr-2">
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <div className="list-none p-2">
                {quotations.slice(0, 5).map((quotation) => (
                  <li key={quotation.id} className="mb-2 border-b pb-2 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/quotations`}>
                          <p className="text-sm font-medium leading-none">{quotation.reference_number}</p>
                          <p className="text-sm text-gray-500">{formatDate(quotation.issue_date)}</p>
                        </Link>
                      </div>
                      <div className="flex items-center">
                        {quotation.status === "Draft" && (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                        {quotation.status === "Sent" && (
                          <Badge className="bg-blue-500">Sent</Badge>
                        )}
                        {quotation.status === "Accepted" && (
                          <Badge className="bg-green-500">Accepted</Badge>
                        )}
                        {quotation.status === "Rejected" && (
                          <Badge variant="destructive">Rejected</Badge>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 mt-4">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 pr-2">
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <div className="list-none p-2">
                {invoices.slice(0, 5).map((invoice) => (
                  <li key={invoice.id} className="mb-2 border-b pb-2 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/invoices`}>
                          <p className="text-sm font-medium leading-none">{invoice.reference_number}</p>
                          <p className="text-sm text-gray-500">{formatDate(invoice.issue_date)}</p>
                        </Link>
                      </div>
                      <div className="flex items-center">
                        {invoice.payment_status === "Paid" && (
                          <Badge className="bg-green-500">Paid</Badge>
                        )}
                        {invoice.payment_status === "Unpaid" && (
                          <Badge variant="destructive">Unpaid</Badge>
                        )}
                        {invoice.payment_status === "Partially Paid" && (
                          <Badge className="bg-yellow-500">Partially Paid</Badge>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="col-span-1 mt-4">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 pr-2">
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <div className="list-none p-2">
                {appointments.slice(0, 5).map((appointment) => (
                  <li key={appointment.id} className="mb-2 border-b pb-2 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/schedule`}>
                          <p className="text-sm font-medium leading-none">{appointment.title}</p>
                          <p className="text-sm text-gray-500">{formatDate(appointment.appointment_date)}</p>
                        </Link>
                      </div>
                      <div className="flex items-center">
                        {appointment.status === "Confirmed" && (
                          <Badge className="bg-blue-500">Confirmed</Badge>
                        )}
                        {appointment.status === "Pending" && (
                          <Badge className="bg-yellow-500">Pending</Badge>
                        )}
                        {appointment.status === "Cancelled" && (
                          <Badge variant="destructive">Cancelled</Badge>
                        )}
                        {appointment.status === "Completed" && (
                          <Badge className="bg-green-500">Completed</Badge>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
