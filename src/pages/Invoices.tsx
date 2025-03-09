import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Edit, Plus, FileText, ChevronsUpDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { invoiceService } from "@/services";
import { Invoice } from "@/types/database";
import { InvoiceWithStatus } from "@/components/quotations/types";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export default function Invoices() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [invoices, setInvoices] = useState<InvoiceWithStatus[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("overview");

  const statusOptions = [
    { value: "overview", label: "Overview" },
    { value: "all", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "paid", label: "Paid" },
    { value: "partially_paid", label: "Partially Paid" },
    { value: "overdue", label: "Overdue" },
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor, textColor;
    
    switch (status) {
      case 'Draft':
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-700';
        break;
      case 'Sent':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-700';
        break;
      case 'Paid':
        bgColor = 'bg-green-100';
        textColor = 'text-green-700';
        break;
      case 'Partially Paid':
        bgColor = 'bg-amber-100';
        textColor = 'text-amber-700';
        break;
      case 'Overdue':
        bgColor = 'bg-red-100';
        textColor = 'text-red-700';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-700';
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const data = await invoiceService.getAll();
        
        const now = new Date();
        const enhancedData = data.map(invoice => {
          const dueDate = new Date(invoice.due_date);
          const isOverdue = dueDate < now && invoice.payment_status !== "Paid";
          return {
            ...invoice,
            isOverdue
          } as InvoiceWithStatus;
        });
        
        setInvoices(enhancedData);
        setFilteredInvoices(enhancedData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching invoices:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to fetch invoices. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    fetchInvoices();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query === "") {
      handleStatusFilter(statusFilter);
    } else {
      setFilteredInvoices(
        invoices.filter(invoice =>
          invoice.reference_number.toLowerCase().includes(query) ||
          invoice.customer_id.toLowerCase().includes(query)
        )
      );
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    
    if (status === "all") {
      setFilteredInvoices(invoices);
    } else if (status === "overview") {
      const recentDraft = invoices.filter(invoice => invoice.status === "Draft").slice(0, 2);
      const recentSent = invoices.filter(invoice => invoice.status === "Sent").slice(0, 2);
      const recentPaid = invoices.filter(invoice => invoice.payment_status === "Paid").slice(0, 2);
      const overdue = invoices.filter(invoice => invoice.isOverdue).slice(0, 3);
      
      const combined = [...recentDraft, ...recentSent, ...recentPaid, ...overdue];
      const uniqueIds = new Set();
      const overview = combined.filter(invoice => {
        if (uniqueIds.has(invoice.id)) return false;
        uniqueIds.add(invoice.id);
        return true;
      });
      
      setFilteredInvoices(overview);
    } else if (status === "overdue") {
      setFilteredInvoices(invoices.filter(invoice => invoice.isOverdue));
    } else {
      const statusMap: Record<string, string> = {
        "draft": "Draft",
        "sent": "Sent",
        "paid": "Paid",
        "partially_paid": "Partially Paid"
      };
      
      setFilteredInvoices(
        invoices.filter(invoice => {
          if (status === "paid" || status === "partially_paid") {
            return invoice.payment_status === statusMap[status];
          } else {
            return invoice.status === statusMap[status];
          }
        })
      );
    }
  };

  if (isLoading) {
    return <div className="page-container">
        <PageHeader title="Invoices" description="Loading invoices..." />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>;
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Invoices"
        description="Manage your invoices."
        actions={
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button onClick={() => navigate("/invoices/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        }
      />

      <div className="mt-8">
        <div className={`flex ${isMobile ? "flex-col" : "items-center justify-between"} gap-4`}>
          <Input
            type="text"
            placeholder="Search invoices..."
            className="max-w-md"
            value={searchQuery}
            onChange={handleSearch}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10">
                Filter by Status
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statusOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleStatusFilter(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-6 overflow-auto">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No invoices found.
            </div>
          ) : (
            <Table>
              <TableCaption>A list of your invoices.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Reference No.</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell>{invoice.reference_number}</TableCell>
                    <TableCell>{invoice.customer_id}</TableCell>
                    <TableCell>{invoice.issue_date}</TableCell>
                    <TableCell>{invoice.due_date}</TableCell>
                    <TableCell className="text-right">RM {invoice.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
