
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Trash2 } from 'lucide-react';
import { QuotationItem } from './types';

interface ItemsTableProps {
  items: QuotationItem[];
  handleItemChange: (index: number, field: keyof QuotationItem, value: string | number) => void;
  removeItem: (index: number) => void;
  showDescription?: boolean;
  categories?: Array<{id: string, name: string, unit?: string}>;
}

export function ItemsTable({ items, handleItemChange, removeItem, showDescription = true, categories = [] }: ItemsTableProps) {
  const [swipeStates, setSwipeStates] = useState<{ [key: number]: boolean }>({});
  const [touchStart, setTouchStart] = useState<{ [key: number]: { x: number, y: number } }>({});
  const [isDragging, setIsDragging] = useState<{ [key: number]: boolean }>({});
  
  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const getCategoryUnit = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.unit || '';
  };

  const resetSwipeState = (index: number) => {
    setSwipeStates(prev => ({
      ...prev,
      [index]: false
    }));
    setIsDragging(prev => ({
      ...prev,
      [index]: false
    }));
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    setTouchStart(prev => ({
      ...prev,
      [index]: { x: touch.clientX, y: touch.clientY }
    }));
    setIsDragging(prev => ({
      ...prev,
      [index]: false
    }));
  };

  const handleTouchMove = (e: React.TouchEvent, index: number) => {
    if (!touchStart[index]) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart[index].x;
    const deltaY = touch.clientY - touchStart[index].y;

    // Only start dragging if horizontal movement is significant and greater than vertical
    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setIsDragging(prev => ({
        ...prev,
        [index]: true
      }));

      // Reveal actions when swiping left (deltaX < 0)
      if (deltaX < -50) {
        setSwipeStates(prev => ({
          ...prev,
          [index]: true
        }));
      } else if (deltaX > 50) {
        // Hide actions when swiping right
        setSwipeStates(prev => ({
          ...prev,
          [index]: false
        }));
      }

      // Apply transform to the item
      const itemRef = itemRefs.current[index];
      if (itemRef) {
        const clampedDelta = Math.max(deltaX, -120); // Limit left swipe to reveal actions
        itemRef.style.transform = `translateX(${clampedDelta}px)`;
        itemRef.style.transition = 'none';
      }
    }
  };

  const handleTouchEnd = (index: number) => {
    const itemRef = itemRefs.current[index];
    if (itemRef) {
      // Snap to final position with animation
      itemRef.style.transition = 'transform 0.2s ease-out';
      
      if (swipeStates[index]) {
        itemRef.style.transform = 'translateX(-120px)';
      } else {
        itemRef.style.transform = 'translateX(0px)';
      }
    }

    setTouchStart(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    
    setIsDragging(prev => ({
      ...prev,
      [index]: false
    }));
  };

  const handleDeleteItem = (index: number) => {
    resetSwipeState(index);
    removeItem(index);
  };

  const handleCancelSwipe = (index: number) => {
    resetSwipeState(index);
  };

  // Close all swipe actions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      Object.keys(swipeStates).forEach(key => {
        const index = parseInt(key);
        if (swipeStates[index]) {
          resetSwipeState(index);
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [swipeStates]);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const categoryUnit = getCategoryUnit(item.category || '');
        
        return (
          <div key={index} className="relative">
            {/* Main item card */}
            <div
              ref={(el) => (itemRefs.current[index] = el)}
              className="bg-white border rounded-lg p-4 shadow-sm relative z-10 touch-manipulation"
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={(e) => handleTouchMove(e, index)}
              onTouchEnd={() => handleTouchEnd(index)}
              onClick={(e) => {
                if (!isDragging[index]) {
                  // Allow normal interactions when not dragging
                } else {
                  e.preventDefault();
                }
              }}
            >
              <div className="space-y-3">
                {showDescription && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Description
                    </label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Item description"
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Unit Price (RM)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice === 0 ? '' : item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className={categoryUnit ? "pr-8" : ""}
                      />
                      {categoryUnit && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                          {categoryUnit}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Amount (RM)
                    </label>
                    <div className="h-9 px-3 py-1 bg-gray-50 border border-gray-200 rounded-md flex items-center text-sm text-gray-600">
                      {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons - positioned outside the card */}
            <div className="absolute right-0 top-0 h-full flex items-center space-x-2 pr-4 z-0">
              <button
                onClick={() => handleCancelSwipe(index)}
                className="w-10 h-10 bg-gray-500 text-white rounded-full flex items-center justify-center shadow-lg"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDeleteItem(index)}
                className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
