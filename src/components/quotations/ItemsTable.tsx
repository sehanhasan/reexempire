
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, X } from "lucide-react";
import { QuotationItem, InvoiceItem } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";

type Item = QuotationItem | InvoiceItem;

interface ItemsTableProps {
  items: Item[];
  handleItemChange: (id: number, field: keyof Item, value: any) => void;
  removeItem: (id: number) => void;
  showDescription?: boolean;
}

export function ItemsTable({
  items,
  handleItemChange,
  removeItem,
  showDescription = true,
}: ItemsTableProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="border rounded-md p-3 relative">
            <Button
              type="button"
              variant="ghost"
              onClick={() => removeItem(item.id)}
              className="absolute top-2 right-2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Description</label>
                <Input
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(item.id, "description", e.target.value)
                  }
                  placeholder="Enter item description"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "quantity",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Unit</label>
                  <Input
                    value={item.unit}
                    onChange={(e) =>
                      handleItemChange(item.id, "unit", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Unit Price (RM)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "unitPrice",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Amount (RM)</label>
                  <div className="bg-gray-50 px-3 py-2 border rounded-md text-right">
                    {item.amount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left font-medium text-gray-500 text-sm w-10">#</th>
            {showDescription && <th className="px-4 py-2 text-left font-medium text-gray-500 text-sm">Description</th>}
            <th className="px-4 py-2 text-left font-medium text-gray-500 text-sm w-20">Qty</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 text-sm w-24">Unit</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500 text-sm w-32">Unit Price (RM)</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500 text-sm w-32">Amount (RM)</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500 text-sm w-16"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className="border-t">
              <td className="px-4 py-2 align-top">{index + 1}</td>
              
              {showDescription && (
                <td className="px-4 py-2">
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                    placeholder="Enter item description"
                  />
                </td>
              )}
              
              <td className="px-4 py-2">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, "quantity", parseFloat(e.target.value))}
                />
              </td>
              
              <td className="px-4 py-2">
                <Input
                  value={item.unit}
                  onChange={(e) => handleItemChange(item.id, "unit", e.target.value)}
                />
              </td>
              
              <td className="px-4 py-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(item.id, "unitPrice", parseFloat(e.target.value))}
                  className="text-right"
                />
              </td>
              
              <td className="px-4 py-2 text-right">
                {item.amount.toFixed(2)}
              </td>
              
              <td className="px-4 py-2 text-right">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 1}
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
