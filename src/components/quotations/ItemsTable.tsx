import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, Pencil, Check, X } from "lucide-react";
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
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState("");
  const [swipedItemId, setSwipedItemId] = useState<number | null>(null);

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

  const handleEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditCategoryValue(category);
  };

  const handleSaveCategory = (oldCategory: string) => {
    // Update all items in this category with the new category name
    items.forEach(item => {
      if ((item.category || 'Other Items') === oldCategory) {
        handleItemChange(item.id, 'category', editCategoryValue || 'Other Items');
      }
    });
    setEditingCategory(null);
    setEditCategoryValue("");
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditCategoryValue("");
  };

  const handleTouchStart = (e: React.TouchEvent, itemId: number) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentTouch = moveEvent.touches[0];
      const diffX = startX - currentTouch.clientX;
      
      if (diffX > 50) { // Swipe left threshold
        setSwipedItemId(itemId);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleTouchOutside = () => {
    setSwipedItemId(null);
  };

  const handleCancelSwipe = () => {
    setSwipedItemId(null);
  };

  const {
    groupedItems,
    orderedCategories
  } = groupItemsByCategory();

  return <div className="w-full overflow-auto" onClick={isMobile ? handleTouchOutside : undefined}>
      {isMobile ? <div className="space-y-5">
          {orderedCategories.map(category => <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                {editingCategory === category ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editCategoryValue}
                      onChange={(e) => setEditCategoryValue(e.target.value)}
                      className="text-blue-600 font-medium text-base h-8"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-green-600 hover:text-green-700"
                      onClick={() => handleSaveCategory(category)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="font-medium text-base text-blue-600">{category}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-500 hover:text-blue-600"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {groupedItems[category].map((item, index) => <div 
                key={item.id} 
                className="relative"
                onClick={(e) => e.stopPropagation()}
              >
                  <div className={`mobile-card border-l-4 border-l-blue-500 rounded-md p-3 space-y-2 bg-white transition-transform duration-200 ${
                    swipedItemId === item.id ? 'transform -translate-x-24' : ''
                  }`}
                  onTouchStart={isMobile ? (e) => handleTouchStart(e, item.id) : undefined}
                  >
                    <div className="space-y-3 pb-1">
                      <div className="space-y-2">
                        <label className="block text-xs mb-1 text-slate-600 font-medium">Item #{index + 1} - Description</label>
                        <Input placeholder="Enter item description" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="h-10 text-xs" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <label className="block text-xs mb-1 text-slate-600 font-medium">Quantity</label>
                          <Input value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="h-10" />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-xs mb-1 text-slate-600 font-medium">Unit Price (RM)</label>
                          <div className="relative">
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              className="h-10" 
                              value={item.unitPrice === 0 ? '' : item.unitPrice} 
                              placeholder="0.00"
                              onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} 
                            />
                            {item.unit && (
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                                {item.unit}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-xs mb-1 text-slate-600 font-medium">Amount (RM)</label>
                          <div className="p-2 h-10 text-right text-gray-800">
                            {formatAmount(item.amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Circular action buttons revealed by swipe - positioned outside the card */}
                  {swipedItemId === item.id && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex gap-3 pr-4">
                      <Button 
                        type="button" 
                        size="icon" 
                        className="h-12 w-12 rounded-full bg-gray-400 hover:bg-gray-500 text-white border-0 shadow-lg" 
                        onClick={handleCancelSwipe}
                      >
                        <X className="h-6 w-6" />
                      </Button>
                      <Button 
                        type="button" 
                        size="icon" 
                        className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg" 
                        onClick={() => removeItem(item.id)} 
                        disabled={items.length <= 1}
                      >
                        <Trash className="h-6 w-6" />
                      </Button>
                    </div>
                  )}
                </div>)}
            </div>)}
        </div> : <table className="w-full">
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
            {orderedCategories.map(category => <React.Fragment key={category}>
                <tr className="bg-gray-50">
                  <td colSpan={6} className="py-2 px-2 font-small text-blue-600 border-t">
                    <div className="flex items-center gap-2">
                      {editingCategory === category ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editCategoryValue}
                            onChange={(e) => setEditCategoryValue(e.target.value)}
                            className="text-blue-600 font-medium h-7 text-sm"
                            autoFocus
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-600 hover:text-green-700"
                            onClick={() => handleSaveCategory(category)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-600 hover:text-red-700"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{category}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-500 hover:text-blue-600"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                {groupedItems[category].map((item, index) => <tr key={item.id} className="border-b last:border-b-0">
                    <td className="py-3 px-1 align-top">
                      {index + 1}
                    </td>
                    <td className="py-3 px-2">
                      <Input placeholder="Enter item description" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className="h-10 text-xs" />
                    </td>
                    <td className="py-3 px-2">
                      <Input value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="text-right h-10" />
                    </td>
                    <td className="py-3 px-2">
                      <div className="relative">
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          className="text-right h-10" 
                          value={item.unitPrice === 0 ? '' : item.unitPrice} 
                          placeholder="0.00"
                          onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} 
                        />
                        {item.unit && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                            {item.unit}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-600">
                      {formatAmount(item.amount)}
                    </td>
                    <td className="py-3 px-1">
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeItem(item.id)} disabled={items.length <= 1}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>)}
              </React.Fragment>)}
          </tbody>
        </table>}
    </div>;
}
