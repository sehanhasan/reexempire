
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { QuotationItem, InvoiceItem } from "./types";
import { CategoryItemSelector, SelectedItem } from "./CategoryItemSelector";
import { EditableCategoryTitle } from "./EditableCategoryTitle";

interface ItemsTableProps {
  items: (QuotationItem | InvoiceItem)[];
  handleItemChange: (id: number, field: keyof (QuotationItem | InvoiceItem), value: any) => void;
  removeItem: (id: number) => void;
  showDescription: boolean;
}

export const ItemsTable = ({ items, handleItemChange, removeItem, showDescription }: ItemsTableProps) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  
  const addItem = () => {
    const newId = Math.max(...items.map(item => item.id), 0) + 1;
    const newItem = {
      id: newId,
      description: "",
      category: "Other Items",
      quantity: 1,
      unit: "Unit",
      unitPrice: 0,
      amount: 0
    };
    // We can't add items from this component, this should be handled by parent
    console.log("Add item should be handled by parent component");
  };

  const updateCategoryTitle = (oldCategory: string, newCategory: string) => {
    items.forEach(item => {
      if (item.category === oldCategory) {
        handleItemChange(item.id, 'category', newCategory);
      }
    });
    setEditingCategory(null);
  };

  const handleSelectFromCategories = (itemId: number) => {
    setCurrentItemId(itemId);
    setShowCategorySelector(true);
  };

  const handleItemsFromCategories = (selectedItems: SelectedItem[]) => {
    if (selectedItems.length > 0 && currentItemId) {
      const selectedItem = selectedItems[0];
      handleItemChange(currentItemId, 'description', selectedItem.description);
      handleItemChange(currentItemId, 'unitPrice', selectedItem.price);
      handleItemChange(currentItemId, 'unit', selectedItem.unit);
    }
    setShowCategorySelector(false);
    setCurrentItemId(null);
  };

  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || "Other Items";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, (QuotationItem | InvoiceItem)[]>);

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className="space-y-2">
            <EditableCategoryTitle
              title={category}
              onTitleChange={(newTitle) => updateCategoryTitle(category, newTitle)}
            />
            
            <div className="border rounded-lg overflow-hidden">
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Unit
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Unit Price
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoryItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <Input
                              value={item.description}
                              onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                              placeholder="Enter description..."
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectFromCategories(item.id)}
                            >
                              Select
                            </Button>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                            min="0"
                            step="0.01"
                            className="w-full"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={item.unit}
                            onValueChange={(value) => handleItemChange(item.id, 'unit', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Unit">Unit</SelectItem>
                              <SelectItem value="Hours">Hours</SelectItem>
                              <SelectItem value="Days">Days</SelectItem>
                              <SelectItem value="Sq Ft">Sq Ft</SelectItem>
                              <SelectItem value="Sq M">Sq M</SelectItem>
                              <SelectItem value="Linear Ft">Linear Ft</SelectItem>
                              <SelectItem value="Linear M">Linear M</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-right font-medium">
                            RM {item.amount?.toFixed(2) || '0.00'}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
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

              {/* Mobile view */}
              <div className="md:hidden space-y-4 p-4">
                {categoryItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="Enter description..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectFromCategories(item.id)}
                      >
                        Select
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Quantity</label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Unit</label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) => handleItemChange(item.id, 'unit', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Unit">Unit</SelectItem>
                            <SelectItem value="Hours">Hours</SelectItem>
                            <SelectItem value="Days">Days</SelectItem>
                            <SelectItem value="Sq Ft">Sq Ft</SelectItem>
                            <SelectItem value="Sq M">Sq M</SelectItem>
                            <SelectItem value="Linear Ft">Linear Ft</SelectItem>
                            <SelectItem value="Linear M">Linear M</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Unit Price</label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Amount</label>
                        <div className="text-right font-medium bg-gray-50 p-2 rounded">
                          RM {item.amount?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CategoryItemSelector
        open={showCategorySelector}
        onOpenChange={setShowCategorySelector}
        onSelectItems={handleItemsFromCategories}
      />
    </>
  );
};
