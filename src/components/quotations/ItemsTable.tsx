
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { QuotationItem } from "./types";

interface ItemsTableProps {
  items: QuotationItem[];
  handleItemChange: (id: number, field: keyof QuotationItem, value: any) => void;
  removeItem: (id: number) => void;
  showDescription?: boolean;
}

export function ItemsTable({
  items,
  handleItemChange,
  removeItem,
  showDescription = true
}: ItemsTableProps) {
  // Format currency without RM symbol for items table
  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };

  // Group items by category
  const groupItemsByCategory = () => {
    const groupedItems: {
      [key: string]: QuotationItem[];
    } = {};
    const orderedCategories: string[] = [];
    items.forEach(item => {
      const category = item.category && item.category.trim() || 'Other Items';
      if (!groupedItems[category]) {
        groupedItems[category] = [];
        orderedCategories.push(category);
      }
      groupedItems[category].push(item);
    });
    return {
      groupedItems,
      orderedCategories
    };
  };

  const { groupedItems, orderedCategories } = groupItemsByCategory();

  return (
    <div className="w-full">
      <div className="space-y-5">
        {orderedCategories.map(category => (
          <div key={category} className="space-y-3">
            <div className="font-medium text-base text-blue-600">{category}</div>
            {groupedItems[category].map((item, index) => (
              <div key={item.id} className="border rounded-md p-3 space-y-2 relative bg-white">
                <div className="absolute top-2 right-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" 
                    onClick={() => removeItem(item.id)} 
                    disabled={items.length <= 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-3 pb-1">
                  <div className="mb-1 font-medium text-sm text-slate-500">Item #{index + 1}</div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs mb-1 text-slate-600 font-medium">Description</label>
                    <Input 
                      placeholder="Enter item description" 
                      value={item.description} 
                      onChange={e => handleItemChange(item.id, 'description', e.target.value)} 
                      className="h-10 text-xs" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <label className="block text-xs mb-1 text-slate-600 font-medium">Quantity</label>
                      <Input 
                        value={item.quantity} 
                        onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} 
                        className="h-10" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs mb-1 text-slate-600 font-medium">Unit Price (RM)</label>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        className="h-10" 
                        value={item.unitPrice} 
                        onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs mb-1 text-slate-600 font-medium">Amount (RM)</label>
                      <div className="p-2 h-10 text-right text-gray-800 bg-gray-50 rounded border">
                        {formatAmount(item.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
