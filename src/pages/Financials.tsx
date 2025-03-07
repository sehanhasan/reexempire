import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/financials/columns";
import { useToast } from "@/components/ui/use-toast";
import { DatePickerWithRange } from "@/components/common/DateRangePicker";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getInvoiceList } from "@/services/invoiceService";
import { Invoice } from "@/types/database";
import { CSVLink } from "react-csv";

const Financials = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date()
  });
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const { isLoading, error, data } = useQuery({
    queryKey: ["invoices"],
    queryFn: getInvoiceList,
  });

  useEffect(() => {
    if (data) {
      setInvoices(data);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from
      });
    }
  };

  const prepareCSVData = () => {
    const headers = columns.map((column) => ({
      label: column.header as string,
      key: column.accessorKey as string,
    }));

    const dataToExport = invoices.map((invoice) => ({
      reference_number: invoice.reference_number,
      customer_id: invoice.customer_id,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax_rate: invoice.tax_rate,
      tax_amount: invoice.tax_amount,
      total: invoice.total,
      payment_status: invoice.payment_status,
    }));

    setCsvData(dataToExport);
  };

  const handleExportCSV = () => {
    prepareCSVData();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Financials"
        description="View and analyze your financial data"
      />
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Financial Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <DatePickerWithRange
                dateRange={dateRange}
                setDateRange={handleDateRangeChange}
                className="w-full md:w-[300px]"
              />
              <Button onClick={handleExportCSV}>
                Export CSV
              </Button>
              {csvData.length > 0 && (
                <CSVLink
                  data={csvData}
                  filename={"financial_report.csv"}
                  className="hidden"
                  target="_blank"
                >
                  Export to CSV
                </CSVLink>
              )}
            </div>
            
            <DataTable
              columns={columns}
              data={invoices}
              searchKey="reference_number"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Financials;
