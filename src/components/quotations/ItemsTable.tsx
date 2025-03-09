
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ChevronDown, ChevronUp, Edit } from "lucide-react";
import { QuotationItem, InvoiceItem } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";

interface ItemsTableProps {
  items: (QuotationItem | InvoiceItem)[];
  handleItemChange: (id: number, field: string, value: any) => void;
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
  const [editableCategories, setEditableCategories] = useState<{[key: number]: boolean}>({});
  
  // Group items by category
  const itemsByCategory: { [category: string]: (QuotationItem | InvoiceItem)[] } = {};
  
  items.forEach(item => {
    const category = item.category || "Uncategorized";
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(item);
  });
  
  const handleCategoryEdit = (id: number, editing: boolean) => {
    setEditableCategories({...editableCategories, [id]: editing});
  };
  
  // For mobile view
  const renderMobileItem = (item: QuotationItem | InvoiceItem) => {
    return (
      <div key={item.id} className="mobile-list-item">
        <div className="flex justify-between mb-2">
          <div className="font-medium text-sm text-blue-700">
            {editableCategories[item.id] ? (
              <Input 
                className="h-8 py-1 px-2 text-sm"
                value={item.category || ''}
                onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                onBlur={() => handleCategoryEdit(item.id, false)}
                autoFocus
              />
            ) : (
              <div className="flex items-center">
                <span>{item.category || 'Uncategorized'}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 ml-1"
                  onClick={() => handleCategoryEdit(item.id, true)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => removeItem(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        {showDescription && (
          <div className="mb-2">
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
              className="text-sm"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="text-xs text-gray-500 mb-1">Quantity</div>
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Unit</div>
            <Select
              value={item.unit}
              onValueChange={(value) => handleItemChange(item.id, 'unit', value)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unit">Unit</SelectItem>
                <SelectItem value="Hour">Hour</SelectItem>
                <SelectItem value="Day">Day</SelectItem>
                <SelectItem value="Set">Set</SelectItem>
                <SelectItem value="Package">Package</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-gray-500 mb-1">Unit Price (RM)</div>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value))}
              className="text-sm"
            />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Amount (RM)</div>
            <div className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-sm">
              {item.amount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="space-y-2">
        {items.map(item => renderMobileItem(item))}
      </div>
    );
  }

  // For desktop view - grouped by category
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] text-sm">
        <thead>
          <tr className="border-b">
            {showDescription && <th className="text-left py-2 px-4 font-medium">Description</th>}
            <th className="text-center py-2 px-2 font-medium">Quantity</th>
            <th className="text-center py-2 px-2 font-medium">Unit</th>
            <th className="text-right py-2 px-2 font-medium">Unit Price (RM)</th>
            <th className="text-right py-2 px-2 font-medium">Amount (RM)</th>
            <th className="text-center py-2 px-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
            <React.Fragment key={category}>
              <tr className="bg-gray-50">
                <td colSpan={showDescription ? 6 : 5} className="py-2 px-4 font-medium text-blue-700">
                  {category}
                </td>
              </tr>
              
              {categoryItems.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  {showDescription && (
                    <td className="py-2 px-4">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        className="text-sm"
                      />
                    </td>
                  )}
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      className="text-sm text-center"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Select
                      value={item.unit}
                      onValueChange={(value) => handleItemChange(item.id, 'unit', value)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unit">Unit</SelectItem>
                        <SelectItem value="Hour">Hour</SelectItem>
                        <SelectItem value="Day">Day</SelectItem>
                        <SelectItem value="Set">Set</SelectItem>
                        <SelectItem value="Package">Package</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value))}
                      className="text-sm text-right"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    {item.amount.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex justify-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCategoryEdit(item.id, true)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {editableCategories[item.id] && (
                      <div className="absolute z-50 mt-1 p-2 bg-white border rounded-md shadow-md">
                        <Input 
                          className="mb-2"
                          value={item.category || ''}
                          onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleCategoryEdit(item.id, false)}>
                          Save
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
