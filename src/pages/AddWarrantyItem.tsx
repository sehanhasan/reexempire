import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, CalendarIcon, UserRound, Trash2, ArrowLeft } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays, addMonths, addYears } from "date-fns";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { customerService } from "@/services";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";

const warrantyItemSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  serial_number: z.string().optional(),
  warranty_period_type: z.string().min(1, "Warranty period is required"),
  issue_date: z.date({
    required_error: "Issue date is required",
  }),
  end_date: z.date().optional(),
});

const warrantyFormSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  invoice_id: z.string().optional(),
  items: z.array(warrantyItemSchema).min(1, "At least one item is required"),
});

type WarrantyFormData = z.infer<typeof warrantyFormSchema>;

export default function AddWarrantyItem() {
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<WarrantyFormData>({
    resolver: zodResolver(warrantyFormSchema),
    defaultValues: {
      customer_id: "",
      invoice_id: "",
      items: [{
        item_name: "",
        serial_number: "",
        warranty_period_type: "30_days",
        issue_date: new Date(),
        end_date: undefined,
      }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll
  });

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.unit_number?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Create warranty items mutation
  const createWarrantyMutation = useMutation({
    mutationFn: async (data: WarrantyFormData) => {
      const warrantyItemsToCreate = data.items.map(item => {
        let expiryDate: Date;
        
        if (item.warranty_period_type === 'custom' && item.end_date) {
          expiryDate = item.end_date;
        } else {
          // Calculate expiry date based on warranty period
          expiryDate = new Date(item.issue_date);
          
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
          }
        }

        return {
          customer_id: data.customer_id,
          invoice_id: data.invoice_id || null,
          item_name: item.item_name,
          serial_number: item.serial_number || null,
          issue_date: format(item.issue_date, 'yyyy-MM-dd'),
          warranty_period_type: item.warranty_period_type,
          warranty_period_value: null,
          warranty_period_unit: null,
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
      navigate('/warranty');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add warranty items",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: WarrantyFormData) => {
    createWarrantyMutation.mutate(data);
  };

  const addNewItem = () => {
    append({
      item_name: "",
      serial_number: "",
      warranty_period_type: "30_days",
      issue_date: new Date(),
      end_date: undefined,
    });
  };

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    form.setValue('customer_id', customer.id);
    setCustomerDialogOpen(false);
  };

  return (
    <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/warranty')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <PageHeader
          title="Add Warranty Items"
          description="Add new warranty items for customers"
        />
      </div>

      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Warranty Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <div className="space-y-2">
                        <Label htmlFor="customer">Customer</Label>
                        <div className="flex gap-2">
                          <Button 
                            id="customer" 
                            type="button" 
                            variant="outline" 
                            onClick={() => setCustomerDialogOpen(true)} 
                            className={`w-full h-10 ${selectedCustomer ? "justify-start" : "justify-center"}`}
                          >
                            {selectedCustomer ? (
                              <>
                                <UserRound className="mr-2 h-4 w-4 text-gray-500" />
                                <span className="truncate">
                                  {selectedCustomer.unit_number ? `${selectedCustomer.unit_number} - ${selectedCustomer.name}` : selectedCustomer.name}
                                </span>
                              </>
                            ) : (
                              <>
                                <Search className="mr-2 h-4 w-4" />
                                Select Customer
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
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
                      <FormControl>
                        <Input 
                          placeholder="Enter invoice number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Warranty Items</h3>

                <div className="space-y-4">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.issue_date`}
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
                                      className="p-3 pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

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
                                <FormLabel>Serial Number</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter serial number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                                    <SelectItem value="7_days">7 Days</SelectItem>
                                    <SelectItem value="30_days">30 Days</SelectItem>
                                    <SelectItem value="3_months">3 Months</SelectItem>
                                    <SelectItem value="6_months">6 Months</SelectItem>
                                    <SelectItem value="1_year">1 Year</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {form.watch(`items.${index}.warranty_period_type`) === 'custom' && (
                            <FormField
                              control={form.control}
                              name={`items.${index}.end_date`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>End Date</FormLabel>
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
                                            <span>Pick end date</span>
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
                                        className="p-3 pointer-events-auto"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button type="button" variant="outline" onClick={addNewItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Item
                </Button>
              </div>

              <div className="flex gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/warranty')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createWarrantyMutation.isPending}
                  className="min-w-32"
                >
                  {createWarrantyMutation.isPending ? "Adding..." : "Add Warranty Items"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Customer Selection Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-60">
              <div className="space-y-2">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      {customer.unit_number && (
                        <div className="text-sm text-muted-foreground">#{customer.unit_number}</div>
                      )}
                      {customer.email && (
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}