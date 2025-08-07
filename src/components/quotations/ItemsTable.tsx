
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { CategoryItemSelector } from "./CategoryItemSelector";

interface QuotationItem {
  id: number;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

interface ItemsTableProps {
  items: QuotationItem[];
  setItems: React.Dispatch<React.SetStateAction<QuotationItem[]>>;
  calculateItemAmount: (item: QuotationItem) => number;
}

export function ItemsTable({ items, setItems, calculateItemAmount }: ItemsTableProps) {
  const addItem = () => {
    const newId = Math.max(...items.map(item => item.id), 0) + 1;
    const newItem: QuotationItem = {
      id: newId,
      description: "",
      category: "Other Items",
      quantity: 1,
      unit: "Unit",
      unitPrice: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: keyof QuotationItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.amount = calculateItemAmount(updatedItem);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || "Other Items";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, QuotationItem[]>);

  const categories = Object.keys(groupedItems).sort();

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium text-gray-700">Description</th>
              <th className="text-center p-3 font-medium text-gray-700 w-20">Qty</th>
              <th className="text-center p-3 font-medium text-gray-700 w-20">Unit</th>
              <th className="text-right p-3 font-medium text-gray-700 w-32">Unit Price</th>
              <th className="text-right p-3 font-medium text-gray-700 w-32">Amount</th>
              <th className="text-center p-3 font-medium text-gray-700 w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <React.Fragment key={category}>
                <tr className="bg-blue-50 border-b">
                  <td colSpan={6} className="p-2 font-semibold text-blue-800 text-sm">
                    {category}
                  </td>
                </tr>
                {groupedItems[category].map((item, idx) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                          className="flex-1"
                        />
                        <CategoryItemSelector
                          onItemSelect={(selectedItem) => {
                            updateItem(item.id, 'description', selectedItem.name);
                            updateItem(item.id, 'unitPrice', selectedItem.price);
                            updateItem(item.id, 'unit', selectedItem.unit);
                            updateItem(item.id, 'category', selectedItem.category);
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-full text-center"
                        min="1"
                        step="0.1"
                      />
                    </td>
                    <td className="p-2">
                      <Select value={item.unit} onValueChange={(value) => updateItem(item.id, 'unit', value)}>
                        <SelectTrigger className="w-full">
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
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full text-right"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="p-2 text-right font-medium">
                      RM {item.amount.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length <= 1}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full border-dashed border-gray-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </div>
  );
}
