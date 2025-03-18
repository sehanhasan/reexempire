import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { quotationService, invoiceService } from "@/services";
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartProps {
  title: string;
  description?: string;
  chartData: any[];
  categories: string[];
  index: string;
  colors?: string[];
  valueFormatter?: (value: any) => string;
  height?: number;
  type?: string;
}

export function Chart({ 
  title, 
  description, 
  chartData, 
  categories, 
  index, 
  colors = ['#3b82f6'], 
  valueFormatter = (value) => `${value}`,
  height = 300,
  type = 'bar'
}: ChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={index} />
            <YAxis />
            <Tooltip formatter={valueFormatter} />
            <Legend />
            {categories.map((category, index) => (
              <Bar 
                key={category}
                dataKey={category} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface RecentQuotationsProps {
  limit?: number;
}

export function RecentQuotations({ limit = 5 }: RecentQuotationsProps) {
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuotations = async () => {
      setIsLoading(true);
      try {
        const data = await quotationService.getAll();
        setQuotations(data.slice(0, limit));
      } catch (error) {
        console.error("Error fetching quotations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotations();
  }, [limit]);

  const getStatusBadge = (status) => {
    const statusText = status?.toLowerCase().replace(/\s+/g, '') || 'default';
    
    let variant: "default" | "destructive" | "outline" | "secondary" | 
               "sent" | "accepted" | "pending" | "rejected" | "draft" | 
               "paid" | "unpaid" | "overdue" | "completed" | "scheduled" | 
               "inprogress" | "cancelled" = "default";
    
    switch(statusText) {
      case 'sent':
        variant = "sent";
        break;
      case 'accepted':
        variant = "accepted";
        break;
      case 'pending':
      case 'partiallypaid':
        variant = "pending";
        break;
      case 'rejected':
        variant = "rejected";
        break;
      case 'draft':
        variant = "draft";
        break;
      case 'paid':
        variant = "paid";
        break;
      case 'unpaid':
        variant = "unpaid";
        break;
      case 'overdue':
        variant = "overdue";
        break;
      case 'completed':
        variant = "completed";
        break;
      case 'scheduled':
      case 'confirmed':
        variant = "scheduled";
        break;
      case 'inprogress':
        variant = "inprogress";
        break;
      case 'cancelled':
        variant = "cancelled";
        break;
      default:
        variant = "default";
    }
    
    return <Badge variant={variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Quotations</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <p>Loading quotations...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotations.map((quotation) => (
                  <tr key={quotation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quotation.reference_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(quotation.quotation_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getStatusBadge(quotation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      RM {parseFloat(quotation.total_amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RecentInvoicesProps {
  limit?: number;
}

export function RecentInvoices({ limit = 5 }: RecentInvoicesProps) {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const data = await invoiceService.getAll();
        setInvoices(data.slice(0, limit));
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [limit]);

  const getStatusBadge = (status) => {
    const statusText = status?.toLowerCase().replace(/\s+/g, '') || 'default';
    
    let variant: "default" | "destructive" | "outline" | "secondary" | 
               "sent" | "accepted" | "pending" | "rejected" | "draft" | 
               "paid" | "unpaid" | "overdue" | "completed" | "scheduled" | 
               "inprogress" | "cancelled" = "default";
    
    switch(statusText) {
      case 'sent':
        variant = "sent";
        break;
      case 'accepted':
        variant = "accepted";
        break;
      case 'pending':
      case 'partiallypaid':
        variant = "pending";
        break;
      case 'rejected':
        variant = "rejected";
        break;
      case 'draft':
        variant = "draft";
        break;
      case 'paid':
        variant = "paid";
        break;
      case 'unpaid':
        variant = "unpaid";
        break;
      case 'overdue':
        variant = "overdue";
        break;
      case 'completed':
        variant = "completed";
        break;
      case 'scheduled':
      case 'confirmed':
        variant = "scheduled";
        break;
      case 'inprogress':
        variant = "inprogress";
        break;
      case 'cancelled':
        variant = "cancelled";
        break;
      default:
        variant = "default";
    }
    
    return <Badge variant={variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <p>Loading invoices...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.reference_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getStatusBadge(invoice.payment_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      RM {parseFloat(invoice.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
