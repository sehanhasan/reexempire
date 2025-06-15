import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

  // Format currency with consistent styling
  const formatRM = (amount: number) => {
    return (
      <div className="flex items-center justify-end">
        <span className="text-gray-500 mr-1">RM</span>
        <span>{amount.toFixed(2)}</span>
      </div>
    );
  };

  // Group items by category
  const groupItemsByCategory = () => {
    const groupedItems: {
      [key: string]: QuotationItem[];
    } = {};
    const orderedCategories: string[] = [];

    items.forEach(item => {
      const category = item.category || 'Other Items';
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

  const {
    groupedItems,
    orderedCategories
  } = groupItemsByCategory();

  return (
    <div className="w-full overflow-auto">
      {isMobile ? (
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
                        className="h-10"
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
                        <label className="block text-xs mb-1 text-slate-600 font-medium">Unit Price</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">RM</span>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            className="pl-8 h-10" 
                            value={item.unitPrice} 
                            onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-xs mb-1 text-slate-600 font-medium">Amount</label>
                        <div className="p-2 h-10 border rounded-md bg-gray-50 flex items-center justify-end">
                          <span className="text-gray-500 text-xs mr-1">RM</span>
                          <span className="text-sm">{item.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-1 text-left font-medium text-sm w-6">#</th>
              <th className="py-2 px-2 text-left font-medium text-sm">Description</th>
              <th className="py-2 px-2 text-right font-medium text-sm w-20">Qty</th>
              <th className="py-2 px-2 text-right font-medium text-sm w-32">Unit Price (RM)</th>
              <th className="py-2 px-2 text-right font-medium text-sm w-32">Amount (RM)</th>
              <th className="py-2 px-1 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {orderedCategories.map(category => (
              <React.Fragment key={category}>
                <tr className="bg-gray-50">
                  <td colSpan={6} className="py-2 px-2 font-small text-blue-600 border-t">
                    {category}
                  </td>
                </tr>
                {groupedItems[category].map((item, index) => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="py-3 px-1 align-top">
                      {index + 1}
                    </td>
                    <td className="py-3 px-2">
                      <Input 
                        placeholder="Enter item description" 
                        value={item.description} 
                        onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                        className="h-10"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input 
                        value={item.quantity} 
                        onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                        className="text-right h-10"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          className="pl-10 text-right h-10" 
                          value={item.unitPrice} 
                          onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} 
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end h-10 px-3 border rounded-md bg-gray-50">
                        <span className="text-gray-500 mr-1">RM</span>
                        <span>{item.amount.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-1">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50" 
                        onClick={() => removeItem(item.id)}
                        disabled={items.length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
