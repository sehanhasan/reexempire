import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, CalendarIcon, Shield, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays, addMonths, addYears } from "date-fns";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { customerService, invoiceService } from "@/services";
import { formatDate } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";

const warrantyItemSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  serial_number: z.string().optional(),
  warranty_period_type: z.string().min(1, "Warranty period is required"),
  warranty_period_value: z.number().optional(),
  warranty_period_unit: z.string().optional(),
});

const warrantyFormSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  invoice_id: z.string().optional(),
  issue_date: z.date({
    required_error: "Issue date is required",
  }),
  items: z.array(warrantyItemSchema).min(1, "At least one item is required"),
});

type WarrantyFormData = z.infer<typeof warrantyFormSchema>;

export default function Warranty() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const form = useForm<WarrantyFormData>({
    resolver: zodResolver(warrantyFormSchema),
    defaultValues: {
      customer_id: "",
      invoice_id: "",
      issue_date: new Date(),
      items: [{
        item_name: "",
        serial_number: "",
        warranty_period_type: "30_days",
        warranty_period_value: undefined,
        warranty_period_unit: "",
      }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  // Fetch warranty items
  const { data: warrantyItems = [], isLoading } = useQuery({
    queryKey: ['warranty-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warranty_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch customers and invoices
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceService.getAll
  });

  // Create warranty items mutation
  const createWarrantyMutation = useMutation({
    mutationFn: async (data: WarrantyFormData) => {
      const warrantyItemsToCreate = data.items.map(item => {
        let expiryDate = new Date(data.issue_date);
        
        // Calculate expiry date based on warranty period
        switch (item.warranty_period_type) {
          case '7_days':
            expiryDate = addDays(expiryDate, 7);
            break;
          case '30_days':
            expiryDate = addDays(expiryDate, 30);
            break;
          case '3_months':
            expiryDate = addMonths(expiryDate, 3);
            break;
          case '6_months':
            expiryDate = addMonths(expiryDate, 6);
            break;
          case '1_year':
            expiryDate = addYears(expiryDate, 1);
            break;
          case 'custom':
            if (item.warranty_period_value && item.warranty_period_unit) {
              switch (item.warranty_period_unit) {
                case 'days':
                  expiryDate = addDays(expiryDate, item.warranty_period_value);
                  break;
                case 'months':
                  expiryDate = addMonths(expiryDate, item.warranty_period_value);
                  break;
                case 'years':
                  expiryDate = addYears(expiryDate, item.warranty_period_value);
                  break;
              }
            }
            break;
        }

        return {
          customer_id: data.customer_id,
          invoice_id: data.invoice_id || null,
          item_name: item.item_name,
          serial_number: item.serial_number || null,
          issue_date: format(data.issue_date, 'yyyy-MM-dd'),
          warranty_period_type: item.warranty_period_type,
          warranty_period_value: item.warranty_period_value || null,
          warranty_period_unit: item.warranty_period_unit || null,
          expiry_date: format(expiryDate, 'yyyy-MM-dd'),
        };
      });

      const { data: result, error } = await supabase
        .from('warranty_items')
        .insert(warrantyItemsToCreate)
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranty-items'] });
      toast({
        title: "Success",
        description: "Warranty items added successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add warranty items",
        variant: "destructive",
      });
    }
  });

  // Delete warranty item mutation
  const deleteWarrantyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('warranty_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranty-items'] });
      toast({
        title: "Success",
        description: "Warranty item deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete warranty item",
        variant: "destructive",
      });
    }
  });

  // Filter warranty items based on search
  const filteredWarrantyItems = warrantyItems.filter(item => {
    if (!searchTerm) return true;
    
    const customer = customers.find(c => c.id === item.customer_id);
    const invoice = invoices.find(i => i.id === item.invoice_id);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      item.item_name.toLowerCase().includes(searchLower) ||
      item.serial_number?.toLowerCase().includes(searchLower) ||
      customer?.name.toLowerCase().includes(searchLower) ||
      customer?.unit_number?.toLowerCase().includes(searchLower) ||
      invoice?.reference_number.toLowerCase().includes(searchLower)
    );
  });

  const getWarrantyStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'Expired', variant: 'destructive' as const };
    if (daysUntilExpiry <= 30) return { status: 'Expiring Soon', variant: 'secondary' as const };
    return { status: 'Active', variant: 'default' as const };
  };

  const columns = [
    {
      accessorKey: "item_name",
      header: "Item Name",
      cell: ({ getValue }: any) => (
        <span className="font-medium">{getValue()}</span>
      )
    },
    {
      accessorKey: "serial_number",
      header: "Serial #",
      cell: ({ getValue }: any) => (
        <span className="font-mono text-sm">{getValue() || '-'}</span>
      )
    },
    {
      accessorKey: "customer_id",
      header: "Customer",
      cell: ({ getValue }: any) => {
        const customer = customers.find(c => c.id === getValue());
        return (
          <div>
            <div className="font-medium">{customer?.name || 'Unknown'}</div>
            {customer?.unit_number && (
              <div className="text-sm text-muted-foreground">#{customer.unit_number}</div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "invoice_id",
      header: "Invoice #",
      cell: ({ getValue }: any) => {
        const invoice = invoices.find(i => i.id === getValue());
        return (
          <span className="font-mono text-sm">
            {invoice?.reference_number || '-'}
          </span>
        );
      }
    },
    {
      accessorKey: "issue_date",
      header: "Issue Date",
      cell: ({ getValue }: any) => formatDate(getValue())
    },
    {
      accessorKey: "expiry_date",
      header: "Expiry Date",
      cell: ({ getValue }: any) => {
        const { status, variant } = getWarrantyStatus(getValue());
        return (
          <div>
            <div>{formatDate(getValue())}</div>
            <Badge variant={variant} className="mt-1">
              {status}
            </Badge>
          </div>
        );
      }
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteWarrantyMutation.mutate(row.original.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    }
  ];

  const onSubmit = (data: WarrantyFormData) => {
    createWarrantyMutation.mutate(data);
  };

  const addNewItem = () => {
    append({
      item_name: "",
      serial_number: "",
      warranty_period_type: "30_days",
      warranty_period_value: undefined,
      warranty_period_unit: "",
    });
  };

  return (
    <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      <PageHeader
        title="Warranty Management"
        description="Track warranty periods for items provided to customers"
      />


      {/* Main Content */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg text-cyan-600">Warranty Items</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Warranty Items
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Warranty Items</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customer_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {customers.map((customer) => (
                                  <SelectItem key={customer.id} value={customer.id}>
                                    {customer.unit_number ? `#${customer.unit_number} - ` : ""}
                                    {customer.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="invoice_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice # (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select invoice" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">No invoice</SelectItem>
                                {invoices.map((invoice) => (
                                  <SelectItem key={invoice.id} value={invoice.id}>
                                    {invoice.reference_number}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="issue_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Issue Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Warranty Items</h3>
                        <Button type="button" variant="outline" onClick={addNewItem}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Another Item
                        </Button>
                      </div>

                      {fields.map((field, index) => (
                        <Card key={field.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium">Item #{index + 1}</h4>
                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`items.${index}.item_name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Item Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Enter item name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.serial_number`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Serial # (Optional)</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Enter serial number" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.warranty_period_type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Warranty Period</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="7_days">7 days</SelectItem>
                                        <SelectItem value="30_days">30 days</SelectItem>
                                        <SelectItem value="3_months">3 months</SelectItem>
                                        <SelectItem value="6_months">6 months</SelectItem>
                                        <SelectItem value="1_year">1 year</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {form.watch(`items.${index}.warranty_period_type`) === 'custom' && (
                                <>
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.warranty_period_value`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Period Value</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            {...field} 
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            placeholder="Enter value" 
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.warranty_period_unit`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Period Unit</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="days">Days</SelectItem>
                                            <SelectItem value="months">Months</SelectItem>
                                            <SelectItem value="years">Years</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit" disabled={createWarrantyMutation.isPending}>
                        {createWarrantyMutation.isPending ? 'Adding...' : 'Add Warranty Items'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by item name, serial #, customer, or invoice #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredWarrantyItems}
            searchKey="item_name"
            isLoading={isLoading}
            emptyMessage="No warranty items found."
          />
        </CardContent>
      </Card>
    </div>
  );
}