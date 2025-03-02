
import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ArrowUpRight, Check, Clock, DollarSign, FileText, Users, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chart } from "@/components/ui/chart";

export default function Dashboard() {
  // Sample data for charts (would come from API in real app)
  const revenueData = [
    { name: 'Jan', total: 1200 },
    { name: 'Feb', total: 2100 },
    { name: 'Mar', total: 1800 },
    { name: 'Apr', total: 2700 },
    { name: 'May', total: 3200 },
    { name: 'Jun', total: 2800 },
    { name: 'Jul', total: 3800 },
    { name: 'Aug', total: 4300 },
    { name: 'Sep', total: 3800 },
    { name: 'Oct', total: 4000 },
    { name: 'Nov', total: 4500 },
    { name: 'Dec', total: 5000 },
  ];
  
  const projectTypeData = [
    { name: 'Bathroom', value: 35 },
    { name: 'Kitchen', value: 25 },
    { name: 'Flooring', value: 15 },
    { name: 'Electrical', value: 12 },
    { name: 'Plumbing', value: 8 },
    { name: 'Other', value: 5 },
  ];
  
  return (
    <div className="page-container">
      <PageHeader 
        title="Dashboard" 
        description="Welcome to RenovateProX dashboard. Get a quick summary of your business."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <StatCard
          title="Total Revenue"
          value="RM 124,500"
          trend="+12%"
          description="vs. previous month"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Active Projects"
          value="8"
          trend="+2"
          description="vs. previous month"
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title="New Customers"
          value="24"
          trend="+5"
          description="vs. previous month"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Completion Rate"
          value="92%"
          trend="+3%"
          description="vs. previous month"
          icon={<ArrowUpRight className="h-5 w-5" />}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              type="bar"
              data={revenueData}
              categories={['total']}
              index="name"
              colors={['#2563eb']}
              valueFormatter={(value: number) => `RM ${value.toLocaleString()}`}
              height={300}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Types</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              type="pie"
              data={projectTypeData}
              index="name"
              categories={['value']}
              colors={['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']}
              valueFormatter={(value: number) => `${value}%`}
              height={300}
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">QT-0012</p>
                  <p className="text-sm text-muted-foreground">Emma Johnson</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">RM 4,500.00</p>
                  <p className="text-sm text-orange-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">QT-0011</p>
                  <p className="text-sm text-muted-foreground">John Davis</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">RM 12,800.00</p>
                  <p className="text-sm text-green-500 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Accepted
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">QT-0010</p>
                  <p className="text-sm text-muted-foreground">Sarah Wilson</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">RM 7,200.00</p>
                  <p className="text-sm text-red-500 flex items-center">
                    <X className="h-3 w-3 mr-1" />
                    Declined
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">INV-0025</p>
                  <p className="text-sm text-muted-foreground">Michael Brown</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">RM 8,350.00</p>
                  <p className="text-sm text-green-500 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Paid
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">INV-0024</p>
                  <p className="text-sm text-muted-foreground">Robert Martinez</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">RM 5,120.00</p>
                  <p className="text-sm text-amber-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Due
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">INV-0023</p>
                  <p className="text-sm text-muted-foreground">Jennifer Lee</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">RM 3,450.00</p>
                  <p className="text-sm text-red-500 flex items-center">
                    <X className="h-3 w-3 mr-1" />
                    Overdue
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
