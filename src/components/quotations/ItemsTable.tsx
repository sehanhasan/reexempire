
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { QuotationItem } from "./types";

interface ItemsTableProps {
  items: QuotationItem[];
  handleItemChange: (id: number, field: keyof QuotationItem, value: any) => void;
  removeItem: (id: number) => void;
  showDescription: boolean;
}

export function ItemsTable({ 
  items, 
  handleItemChange, 
  removeItem, 
  showDescription 
}: ItemsTableProps) {
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            {showDescription && (
              <th className="text-left p-2 font-medium text-gray-700 text-sm">Description</th>
            )}
            <th className="text-center p-2 font-medium text-gray-700 text-sm w-20">Qty</th>
            <th className="text-center p-2 font-medium text-gray-700 text-sm w-20">Unit</th>
            <th className="text-right p-2 font-medium text-gray-700 text-sm w-28">Unit Price</th>
            <th className="text-right p-2 font-medium text-gray-700 text-sm w-28">Amount</th>
            <th className="text-center p-2 font-medium text-gray-700 text-sm w-16">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              {showDescription && (
                <td className="p-2">
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    placeholder="Item description"
                    className="text-sm h-9"
                  />
                </td>
              )}
              <td className="p-2">
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                  className="w-full text-center text-sm h-9"
                  min="1"
                  step="0.1"
                />
              </td>
              <td className="p-2">
                <Select 
                  value={item.unit} 
                  onValueChange={(value) => handleItemChange(item.id, 'unit', value)}
                >
                  <SelectTrigger className="w-full text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unit">Unit</SelectItem>
                    <SelectItem value="Set">Set</SelectItem>
                    <SelectItem value="Point">Point</SelectItem>
                    <SelectItem value="Sqft">Sqft</SelectItem>
                    <SelectItem value="Meter">Meter</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-full text-right text-sm h-9"
                  min="0"
                  step="0.01"
                />
              </td>
              <td className="p-2 text-right font-medium text-sm">
                RM {item.amount.toFixed(2)}
              </td>
              <td className="p-2 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 1}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
