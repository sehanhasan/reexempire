
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  FileText, 
  Receipt, // Replacing FileInvoice with Receipt
  Users, 
  Calendar, 
  TrendingUp, 
  ClipboardCheck, 
  Clock
} from "lucide-react";

export default function Dashboard() {
  // Mock data - would come from API in real app
  const stats = [
    { title: "Total Quotations", value: "128", trend: { value: 12, isPositive: true }, icon: <FileText size={18} /> },
    { title: "Pending Invoices", value: "24", trend: { value: 5, isPositive: false }, icon: <Receipt size={18} /> },
    { title: "Customers", value: "84", trend: { value: 8, isPositive: true }, icon: <Users size={18} /> },
    { title: "Total Revenue", value: "$137,842", trend: { value: 14, isPositive: true }, icon: <TrendingUp size={18} /> },
  ];
  
  const upcomingJobs = [
    { id: 1, customer: "John Smith", service: "Bathroom Renovation", date: "Sep 12", status: "Confirmed" },
    { id: 2, customer: "Emma Johnson", service: "Kitchen Remodel", date: "Sep 14", status: "Confirmed" },
    { id: 3, customer: "Michael Brown", service: "Flooring Installation", date: "Sep 15", status: "Pending" },
  ];

  const recentInvoices = [
    { id: "INV-001", customer: "Jane Cooper", amount: "$1,250.00", status: "Paid", date: "Sep 5" },
    { id: "INV-002", customer: "Robert Fox", amount: "$2,840.00", status: "Pending", date: "Sep 4" },
    { id: "INV-003", customer: "Cody Fisher", amount: "$3,150.00", status: "Overdue", date: "Aug 30" },
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Dashboard" 
        description="Welcome to RenovateProX. Here's an overview of your business."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            trend={stat.trend}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Upcoming Jobs</h3>
            <Calendar size={18} className="text-blue-600" />
          </div>
          <div className="space-y-3">
            {upcomingJobs.map((job) => (
              <div key={job.id} className="flex items-center p-3 rounded-md hover:bg-slate-50 transition-colors">
                <div className="mr-4 p-2 bg-blue-50 rounded-md text-blue-600">
                  <ClipboardCheck size={16} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{job.customer}</p>
                  <p className="text-sm text-slate-500">{job.service}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{job.date}</p>
                  <p className={`text-xs ${
                    job.status === "Confirmed" ? "text-green-600" : "text-amber-600"
                  }`}>
                    {job.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent Invoices</h3>
            <Receipt size={18} className="text-blue-600" />
          </div>
          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center p-3 rounded-md hover:bg-slate-50 transition-colors">
                <div className="mr-4 p-2 bg-blue-50 rounded-md text-blue-600">
                  <Clock size={16} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{invoice.customer}</p>
                  <p className="text-sm text-slate-500">{invoice.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{invoice.amount}</p>
                  <p className={`text-xs ${
                    invoice.status === "Paid" ? "text-green-600" : 
                    invoice.status === "Pending" ? "text-amber-600" : "text-red-600"
                  }`}>
                    {invoice.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
