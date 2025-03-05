
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
  
  return (
    <div className="w-full overflow-auto">
      {isMobile ? (
        // Mobile view
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="border rounded-md p-3 space-y-2 relative">
              <div className="absolute top-2 right-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 1}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <label className="block text-xs mb-1 text-muted-foreground">Description</label>
                    <Input
                      placeholder="Enter item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-muted-foreground">Qty</label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="h-10 text-center"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs mb-1 text-muted-foreground">Unit</label>
                    <Input
                      placeholder="Unit"
                      value={item.unit}
                      onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-muted-foreground">Unit Price</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">RM</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-8 h-10 text-right"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs mb-1 text-muted-foreground">Amount</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">RM</span>
                      <Input
                        type="number"
                        className="pl-8 h-10 text-right"
                        value={item.amount.toFixed(2)}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop view
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-1 text-left font-medium text-sm w-6">#</th>
              <th className="py-2 px-2 text-left font-medium text-sm">Description</th>
              <th className="py-2 px-2 text-right font-medium text-sm w-20">Qty</th>
              <th className="py-2 px-2 text-right font-medium text-sm w-24">Unit</th>
              <th className="py-2 px-2 text-right font-medium text-sm w-32">Unit Price (RM)</th>
              <th className="py-2 px-2 text-right font-medium text-sm w-32">Amount (RM)</th>
              <th className="py-2 px-1 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b last:border-b-0">
                <td className="py-3 px-1 align-top">
                  {index + 1}
                </td>
                <td className="py-3 px-2">
                  <Input
                    placeholder="Enter item description"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    className="h-10"
                  />
                </td>
                <td className="py-3 px-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    className="text-right h-10"
                  />
                </td>
                <td className="py-3 px-2">
                  <Input
                    placeholder="Unit"
                    value={item.unit}
                    onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                    className="h-10"
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
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                    <Input
                      type="number"
                      className="pl-10 text-right h-10"
                      value={item.amount.toFixed(2)}
                      disabled
                    />
                  </div>
                </td>
                <td className="py-3 px-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
