
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ItemBase } from "./types";

interface ItemsTableProps<T extends ItemBase> {
  items: T[];
  handleItemChange: (id: number, field: keyof T, value: any) => void;
  removeItem: (id: number) => void;
}

export function ItemsTable<T extends ItemBase>({ 
  items, 
  handleItemChange, 
  removeItem 
}: ItemsTableProps<T>) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="py-3 px-4 text-left font-medium">Description</th>
            <th className="py-3 px-4 text-center font-medium w-20">Qty</th>
            <th className="py-3 px-4 text-center font-medium w-24">Unit</th>
            <th className="py-3 px-4 text-right font-medium w-32">Unit Price</th>
            <th className="py-3 px-4 text-right font-medium w-32">Amount</th>
            <th className="py-3 px-4 text-center font-medium w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="py-3 px-4">
                <Input
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                  required
                />
              </td>
              <td className="py-3 px-4">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value))}
                  required
                  className="text-center"
                />
              </td>
              <td className="py-3 px-4">
                <Select
                  value={item.unit}
                  onValueChange={(value) => handleItemChange(item.id, "unit", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unit">Unit</SelectItem>
                    <SelectItem value="Hour">Hour</SelectItem>
                    <SelectItem value="Day">Day</SelectItem>
                    <SelectItem value="Meter">Meter</SelectItem>
                    <SelectItem value="Sq.m">Sq.m</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="py-3 px-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(item.id, "unitPrice", parseFloat(e.target.value))}
                    required
                    className="text-right pl-10"
                  />
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                  <Input
                    type="number"
                    value={item.amount.toFixed(2)}
                    disabled
                    className="text-right pl-10"
                  />
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                  disabled={items.length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
