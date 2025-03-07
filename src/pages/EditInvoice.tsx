import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { invoiceService, customerService } from "@/services";
import { Invoice, Customer } from "@/types/database";
import { format, parseISO } from 'date-fns';
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | undefined>(undefined);
  const [issueDate, setIssueDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch invoice data
        if (id) {
          const invoice = await invoiceService.getById(id);
          setInvoiceData(invoice);
          setSelectedCustomer(invoice?.customer_id);
          setIssueDate(invoice.issue_date ? parseISO(invoice.issue_date) : undefined);
          setDueDate(invoice.due_date ? parseISO(invoice.due_date) : undefined);
        }
        
        // Fetch customers
        const customersData = await customerService.getAll();
        setCustomers(customersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load invoice details.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, [name]: value } as Invoice));
  };
  
  const handleCustomerChange = (value: string) => {
    setSelectedCustomer(value);
    setInvoiceData(prev => ({ ...prev, customer_id: value } as Invoice));
  };
  
  const handleIssueDateChange = (date: Date | undefined) => {
    setIssueDate(date);
    setInvoiceData(prev => ({ ...prev, issue_date: date ? format(date, 'yyyy-MM-dd') : null } as Invoice));
  };
  
  const handleDueDateChange = (date: Date | undefined) => {
    setDueDate(date);
    setInvoiceData(prev => ({ ...prev, due_date: date ? format(date, 'yyyy-MM-dd') : null } as Invoice));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (invoiceData) {
        await invoiceService.update(id!, invoiceData);
        toast({
          title: "Success",
          description: "Invoice updated successfully."
        });
        navigate("/invoices");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <div>Loading invoice details...</div>;
  }
  
  return (
    <div className="page-container">
      <PageHeader 
        title={`Edit Invoice: ${invoiceData?.reference_number || ""}`}
        actions={
          <Button variant="outline" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        }
      />
      
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Card>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input 
                  id="reference_number"
                  name="reference_number"
                  value={invoiceData?.reference_number || ""}
                  onChange={handleInputChange}
                  placeholder="Enter reference number"
                />
              </div>
              
              <div>
                <Label htmlFor="customer_id">Customer</Label>
                <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !issueDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {issueDate ? format(issueDate, "yyyy-MM-dd") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePicker
                      mode="single"
                      selected={issueDate}
                      onSelect={handleIssueDateChange}
                      className="border-0"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "yyyy-MM-dd") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePicker
                      mode="single"
                      selected={dueDate}
                      onSelect={handleDueDateChange}
                      className="border-0"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={invoiceData?.notes || ""}
                onChange={handleInputChange}
                placeholder="Enter any notes"
              />
            </div>
            
            <div>
              <Label htmlFor="terms">Terms</Label>
              <Textarea
                id="terms"
                name="terms"
                value={invoiceData?.terms || ""}
                onChange={handleInputChange}
                placeholder="Enter terms and conditions"
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Invoice
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
