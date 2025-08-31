import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Warehouse } from "lucide-react";
import { inventoryService } from "@/services";

interface InventoryItemSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: any) => void;
  selectedItemId?: string;
}

export function InventoryItemSelector({ 
  open, 
  onOpenChange, 
  onSelect, 
  selectedItemId 
}: InventoryItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleSelectItem = (item: any) => {
    onSelect(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Inventory Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <ScrollArea className="h-60">
            <div className="space-y-2">
              {availableItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-8 w-8 mb-2" />
                  <p>No available inventory items found</p>
                </div>
              ) : (
                availableItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                      selectedItemId === item.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelectItem(item)}
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
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Warehouse className="h-3 w-3" />
                        {item.quantity} in stock
                      </Badge>
                      {item.unit_price && (
                        <div className="text-sm text-muted-foreground">
                          RM {parseFloat(item.unit_price.toString()).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}