
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { CategoryItemSelector } from "./CategoryItemSelector";
import { EditableCategoryTitle } from "./EditableCategoryTitle";

export interface ItemBase {
  id: number;
  description: string;
  category: string;
  quantity: number | string;
  unit: string;
  unitPrice: number;
  amount: number;
}

interface ItemsTableProps {
  items: ItemBase[];
  onItemChange: (id: number, field: keyof ItemBase, value: any) => void;
  onRemoveItem: (id: number) => void;
  onAddItem: () => void;
  showDescription?: boolean;
}

export function ItemsTable({ 
  items, 
  onItemChange, 
  onRemoveItem, 
  onAddItem, 
  showDescription = true 
}: ItemsTableProps) {
  const [openCategorySelector, setOpenCategorySelector] = useState<{ [key: string]: boolean }>({});

  const handleCategoryTitleChange = (oldCategory: string, newCategory: string) => {
    // Update all items with the old category to use the new category name
    items.forEach(item => {
      if (item.category === oldCategory) {
        onItemChange(item.id, 'category', newCategory);
      }
    });
  };

  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || "Other Items";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ItemBase[]>);

  const categories = Object.keys(groupedItems).sort();

  const handleSelectItems = (category: string, selectedItems: any[]) => {
    selectedItems.forEach((selectedItem) => {
      const newId = Math.max(...items.map(item => item.id), 0) + 1;
      const newItem: ItemBase = {
        id: newId,
        description: selectedItem.name,
        category: category,
        quantity: 1,
        unit: selectedItem.unit,
        unitPrice: selectedItem.price,
        amount: selectedItem.price,
      };
      
      // Since we don't have an onAddItemWithData prop, we'll simulate it
      // by calling onAddItem and then updating the last item
      onAddItem();
      
      // Update the item with the selected data
      setTimeout(() => {
        onItemChange(newId, 'description', selectedItem.name);
        onItemChange(newId, 'category', category);
        onItemChange(newId, 'unit', selectedItem.unit);
        onItemChange(newId, 'unitPrice', selectedItem.price);
        onItemChange(newId, 'amount', selectedItem.price);
      }, 0);
    });
    
    setOpenCategorySelector(prev => ({ ...prev, [category]: false }));
  };

  return (
    <div className="space-y-6">
      {categories.map((category, categoryIndex) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center justify-between">
            <EditableCategoryTitle
              title={`${categoryIndex + 1}. ${category}`}
              onSave={(newTitle) => {
                // Remove the number prefix when saving
                const cleanTitle = newTitle.replace(/^\d+\.\s*/, '');
                handleCategoryTitleChange(category, cleanTitle);
              }}
            />
            <CategoryItemSelector
              onSelectItems={(selectedItems) => handleSelectItems(category, selectedItems)}
              open={openCategorySelector[category] || false}
              onOpenChange={(open) => setOpenCategorySelector(prev => ({ ...prev, [category]: open }))}
            />
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[300px]">
                      Description
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 w-20">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 w-20">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 w-32">
                      Unit Price (RM)
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 w-32">
                      Amount (RM)
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 w-16">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedItems[category].map((item, index) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">
                        {showDescription ? (
                          <Input
                            value={item.description}
                            onChange={(e) => onItemChange(item.id, 'description', e.target.value)}
                            placeholder="Enter item description"
                            className="min-w-[280px]"
                          />
                        ) : (
                          <span className="text-sm">{item.description}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => onItemChange(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-full text-center"
                          min="1"
                          step="0.01"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={item.unit}
                          onValueChange={(value) => onItemChange(item.id, 'unit', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Unit">Unit</SelectItem>
                            <SelectItem value="Sqft">Sqft</SelectItem>
                            <SelectItem value="Meter">Meter</SelectItem>
                            <SelectItem value="Piece">Piece</SelectItem>
                            <SelectItem value="Set">Set</SelectItem>
                            <SelectItem value="Lot">Lot</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => onItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full text-right"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        RM {item.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center">
            <CategoryItemSelector
              onSelectItems={(selectedItems) => handleSelectItems(category, selectedItems)}
              open={false}
              onOpenChange={() => {}}
            />
          </div>
        </div>
      ))}

      <div className="flex justify-center pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onAddItem}
          className="w-full max-w-md"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </div>
    </div>
  );
}
