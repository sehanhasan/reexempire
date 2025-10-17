import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, PackageX } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { inventoryService } from "@/services/inventoryService";
import { generateDemandListPDF, downloadPDF } from "@/utils/pdfGenerator";

interface DemandItem {
  inventory_item_id: string;
  item_name: string;
  current_stock: number;
  required_quantity: number;
  urgent: boolean;
}

export default function AddDemandList() {
  const navigate = useNavigate();
  const [requestedDate] = useState(new Date());
  const [requiredDate, setRequiredDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, DemandItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch low stock and out of stock items
  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['low-stock-items'],
    queryFn: inventoryService.getLowStockItems
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: inventoryService.getAllItems
  });

  // Combine low stock and out of stock items
  const problemItems = allItems.filter(item => 
    item.status === 'Active' && (
      item.quantity === 0 || 
      (item.min_stock_level && item.quantity <= item.min_stock_level)
    )
  );

  const handleToggleItem = (itemId: string, item: any, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => ({
        ...prev,
        [itemId]: {
          inventory_item_id: itemId,
          item_name: item.name,
          current_stock: item.quantity,
          required_quantity: Math.max(1, (item.min_stock_level || 10) - item.quantity),
          urgent: false
        }
      }));
    } else {
      setSelectedItems(prev => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    }
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        required_quantity: Math.max(1, quantity)
      }
    }));
  };

  const handleUrgentChange = (itemId: string, urgent: boolean) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        urgent
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(selectedItems).length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one item.",
        variant: "destructive"
      });
      return;
    }

    if (!requiredDate) {
      toast({
        title: "Validation Error",
        description: "Please select a required date.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate total amount based on selected items
      const totalAmount = Object.values(selectedItems).reduce((sum, item) => {
        const inventoryItem = allItems.find(i => i.id === item.inventory_item_id);
        const unitPrice = inventoryItem?.unit_price || 0;
        return sum + (unitPrice * item.required_quantity);
      }, 0);

      // Determine priority based on urgent items
      const hasUrgentItems = Object.values(selectedItems).some(item => item.urgent);
      const priority = hasUrgentItems ? 'Urgent' : 'Normal';

      // Create demand list
      const { data: demandList, error: demandListError } = await supabase
        .from('demand_lists')
        .insert([{
          title: `Demand List - ${format(new Date(), 'dd/MM/yyyy')}`,
          description: `Auto-generated demand list for low stock items`,
          priority,
          status: 'Draft',
          notes: notes.trim() || null,
          requested_date: requestedDate.toISOString().split('T')[0],
          required_date: requiredDate.toISOString().split('T')[0],
          total_amount: totalAmount
        }])
        .select()
        .single();

      if (demandListError) throw demandListError;

      // Create demand list items
      const demandListItems = Object.values(selectedItems).map(item => {
        const inventoryItem = allItems.find(i => i.id === item.inventory_item_id);
        const unitPrice = inventoryItem?.unit_price || 0;
        return {
          demand_list_id: demandList.id,
          inventory_item_id: item.inventory_item_id,
          item_name: item.item_name,
          quantity: item.required_quantity,
          unit_price: unitPrice,
          amount: unitPrice * item.required_quantity,
          notes: item.urgent ? 'URGENT' : null
        };
      });

      const { error: itemsError } = await supabase
        .from('demand_list_items')
        .insert(demandListItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Demand list created successfully!"
      });

      // Generate and download PDF
      const pdfItems = Object.values(selectedItems).map(item => {
        const inventoryItem = allItems.find(i => i.id === item.inventory_item_id);
        const unitPrice = inventoryItem?.unit_price || 0;
        return {
          item_name: item.item_name,
          current_stock: item.current_stock,
          required_quantity: item.required_quantity,
          unit_price: unitPrice,
          amount: unitPrice * item.required_quantity,
          urgent: item.urgent
        };
      });

      const pdf = generateDemandListPDF({
        title: `Demand List - ${format(new Date(), 'dd/MM/yyyy')}`,
        requestedDate: format(requestedDate, 'dd/MM/yyyy'),
        requiredDate: format(requiredDate, 'dd/MM/yyyy'),
        priority,
        items: pdfItems,
        totalAmount,
        notes: notes.trim() || undefined
      });

      downloadPDF(pdf, `Demand-List-${format(new Date(), 'ddMMyyyy')}.pdf`);

      navigate('/inventory');
    } catch (error) {
      console.error('Error creating demand list:', error);
      toast({
        title: "Error",
        description: "Failed to create demand list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Demand List</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Requested Date</Label>
                <Input
                  value={format(requestedDate, "PPP")}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Required Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !requiredDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {requiredDate ? format(requiredDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={requiredDate}
                      onSelect={setRequiredDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Items *</Label>
              {problemItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PackageX className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No low stock or out of stock items found</p>
                </div>
              ) : (
                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {problemItems.map((item) => {
                    const isSelected = !!selectedItems[item.id];
                    const selectedItem = selectedItems[item.id];
                    
                    return (
                      <div key={item.id} className="p-4 hover:bg-accent/50">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleToggleItem(item.id, item, checked as boolean)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Current Stock: <span className={item.quantity === 0 ? "text-red-600 font-semibold" : ""}>{item.quantity}</span>
                                  {item.min_stock_level && ` • Min Level: ${item.min_stock_level}`}
                                </div>
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs whitespace-nowrap">Required Qty:</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={selectedItem?.required_quantity || 1}
                                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                    className="h-8 w-20"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={selectedItem?.urgent || false}
                                    onCheckedChange={(checked) => handleUrgentChange(item.id, checked)}
                                  />
                                  <Label className="text-xs">Urgent</Label>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {Object.keys(selectedItems).length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {Object.keys(selectedItems).length} item(s) selected
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter additional notes"
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Demand List"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/inventory')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
