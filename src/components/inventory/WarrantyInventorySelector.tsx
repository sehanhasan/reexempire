import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Package, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inventoryService } from "@/services";

interface WarrantyItem {
  id: string;
  name: string;
  serialNumber: string;
  warrantyPeriod: string;
  endDate?: Date;
}

interface WarrantyInventorySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItems: (items: WarrantyItem[]) => void;
}

export function WarrantyInventorySelector({ open, onOpenChange, onSelectItems }: WarrantyInventorySelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, WarrantyItem>>({});

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory-items-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('status', 'Active')
        .gt('quantity', 0)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (inventoryItem: any) => {
    const newId = `${inventoryItem.id}-${Date.now()}`;
    const newItem: WarrantyItem = {
      id: newId,
      name: inventoryItem.name,
      serialNumber: "",
      warrantyPeriod: "30_days",
      endDate: undefined
    };

    setSelectedItems(prev => ({
      ...prev,
      [newId]: newItem
    }));
  };

  const handleUpdateItem = (id: string, field: keyof WarrantyItem, value: any) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleConfirm = () => {
    const items = Object.values(selectedItems);
    onSelectItems(items);
    setSelectedItems({});
    setSearchTerm("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedItems({});
    setSearchTerm("");
    onOpenChange(false);
  };

  const getWarrantyPeriodLabel = (period: string) => {
    switch (period) {
      case '7_days': return '7 Days';
      case '30_days': return '30 Days';
      case '3_months': return '3 Months';
      case '6_months': return '6 Months';
      case '1_year': return '1 Year';
      default: return period;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-cyan-600" />
            Select Items
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Available Items */}
            <div>
              <h3 className="text-sm font-medium mb-2">Available Inventory Items</h3>
              <ScrollArea className="h-64 border rounded-lg">
                <div className="p-2 space-y-2">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="cursor-pointer hover:bg-accent" onClick={() => handleAddItem(item)}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-sm">{item.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Stock: {item.quantity}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Selected Items */}
            <div>
              <h3 className="text-sm font-medium mb-2">Selected Warranty Items ({Object.keys(selectedItems).length})</h3>
              <ScrollArea className="h-64 border rounded-lg">
                <div className="p-2 space-y-3">
                  {Object.values(selectedItems).map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm text-cyan-600">{item.name}</div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500"
                            >
                              Remove
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <Label className="text-xs">Serial Number</Label>
                              <Input
                                placeholder="Enter serial number"
                                value={item.serialNumber}
                                onChange={(e) => handleUpdateItem(item.id, 'serialNumber', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-xs">Warranty Period</Label>
                              <Select 
                                value={item.warrantyPeriod} 
                                onValueChange={(value) => handleUpdateItem(item.id, 'warrantyPeriod', value)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="7_days">7 Days</SelectItem>
                                  <SelectItem value="30_days">30 Days</SelectItem>
                                  <SelectItem value="3_months">3 Months</SelectItem>
                                  <SelectItem value="6_months">6 Months</SelectItem>
                                  <SelectItem value="1_year">1 Year</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={Object.keys(selectedItems).length === 0}
            >
              Add {Object.keys(selectedItems).length} Warranty Item(s)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}