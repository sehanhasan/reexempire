import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Package, Warehouse, Shield, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { inventoryService } from "@/services";

interface WarrantyItem {
  inventoryItem: any;
  serialNumber: string;
  warrantyPeriod: string;
}

interface WarrantyInventorySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItems: (items: { id?: number; description: string; category: string; quantity: number; unit: string; price: number }[]) => void;
}

export function WarrantyInventorySelector({ 
  open, 
  onOpenChange, 
  onSelectItems
}: WarrantyInventorySelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<WarrantyItem[]>([]);

  // Fetch inventory items
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: inventoryService.getAllItems
  });

  // Filter active items with stock
  const availableItems = inventoryItems.filter(item => 
    item.status === 'Active' && 
    item.quantity > 0 &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.category?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddItem = (inventoryItem: any) => {
    const newItem: WarrantyItem = {
      inventoryItem,
      serialNumber: "",
      warrantyPeriod: "30_days"
    };
    setSelectedItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof Omit<WarrantyItem, 'inventoryItem'>, value: string) => {
    setSelectedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const formatWarrantyPeriod = (period: string) => {
    switch (period) {
      case '7_days': return '7 Days';
      case '30_days': return '30 Days';
      case '3_months': return '3 Months';
      case '6_months': return '6 Months';
      case '1_year': return '1 Year';
      case 'custom': return 'Custom';
      default: return period;
    }
  };

  const handleConfirm = () => {
    if (selectedItems.length === 0) return;

    const warrantyItems = selectedItems.map((item, index) => ({
      id: Date.now() + index, // Generate unique ID
      description: `${item.inventoryItem.name}${item.serialNumber ? ` - ${item.serialNumber}` : ''} (${formatWarrantyPeriod(item.warrantyPeriod)})`,
      category: "Warranty Items",
      quantity: 1,
      unit: "pcs",
      price: parseFloat(item.inventoryItem.unit_price?.toString() || "0")
    }));

    onSelectItems(warrantyItems);
    setSelectedItems([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedItems([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Select Warranty Items from Inventory
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 gap-4 min-h-0">
          {/* Available Items */}
          <div className="flex-1 space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Available Inventory Items</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-2">
                {availableItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="mx-auto h-8 w-8 mb-2" />
                    <p>No available inventory items found</p>
                  </div>
                ) : (
                  availableItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <div className="font-medium">{item.name}</div>
                        </div>
                        {item.sku && (
                          <div className="text-sm text-muted-foreground font-mono">
                            SKU: {item.sku}
                          </div>
                        )}
                        {item.category && (
                          <div className="text-sm text-muted-foreground">
                            Category: {item.category}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Warehouse className="h-3 w-3" />
                          {item.quantity} in stock
                        </Badge>
                        {item.unit_price && (
                          <div className="text-sm text-muted-foreground">
                            RM {parseFloat(item.unit_price.toString()).toFixed(2)}
                          </div>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleAddItem(item)}
                          disabled={selectedItems.some(si => si.inventoryItem.id === item.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Selected Items */}
          <div className="flex-1 space-y-4">
            <Label className="text-sm font-medium">Selected Warranty Items ({selectedItems.length})</Label>
            
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-2">
                {selectedItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="mx-auto h-8 w-8 mb-2" />
                    <p>No items selected</p>
                  </div>
                ) : (
                  selectedItems.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{item.inventoryItem.name}</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor={`serial-${index}`} className="text-xs">Serial Number</Label>
                              <Input
                                id={`serial-${index}`}
                                value={item.serialNumber}
                                onChange={(e) => handleUpdateItem(index, 'serialNumber', e.target.value)}
                                placeholder="Enter serial number"
                                className="h-8"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`warranty-${index}`} className="text-xs">Warranty Period</Label>
                              <Select
                                value={item.warrantyPeriod}
                                onValueChange={(value) => handleUpdateItem(index, 'warrantyPeriod', value)}
                              >
                                <SelectTrigger className="h-8">
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
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={selectedItems.length === 0}
          >
            Add {selectedItems.length} Item{selectedItems.length !== 1 ? 's' : ''} to Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}