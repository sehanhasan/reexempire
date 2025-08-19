
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QuotationItem, DepositInfo } from "./types";
import { ItemsTable } from "./ItemsTable";
import { CategoryItemSelector } from "./CategoryItemSelector";
import { useIsMobile } from "@/hooks/use-mobile";

interface QuotationItemsCardProps {
  items: QuotationItem[];
  setItems: React.Dispatch<React.SetStateAction<QuotationItem[]>>;
  depositInfo: DepositInfo;
  setDepositInfo: React.Dispatch<React.SetStateAction<DepositInfo>>;
  calculateItemAmount: (item: QuotationItem) => number;
  documentType?: 'quotation' | 'invoice';
}

export function QuotationItemsCard({
  items,
  setItems,
  depositInfo,
  setDepositInfo,
  calculateItemAmount,
  documentType = 'quotation'
}: QuotationItemsCardProps) {
  const isMobile = useIsMobile();
  
  const handleItemChange = (id: number, field: keyof QuotationItem, value: any) => {
    setItems(currentItems => {
      return currentItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate amount when quantity or unit price changes
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.amount = calculateItemAmount(updatedItem);
          }
          
          return updatedItem;
        }
        return item;
      });
    });
  };

  const addItem = () => {
    const newId = Math.max(...items.map(item => item.id), 0) + 1;
    const newItem: QuotationItem = {
      id: newId,
      description: "",
      category: "",
      quantity: 1,
      unit: "Unit",
      unitPrice: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + (qty * unitPrice);
  }, 0);
  
  const depositAmount = depositInfo.requiresDeposit ? 
    (subtotal * (depositInfo.depositPercentage / 100)) : 0;

  // Format currency with RM symbol
  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          {documentType === 'invoice' ? 'Invoice Items' : 'Items'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ItemsTable 
          items={items}
          handleItemChange={handleItemChange}
          removeItem={removeItem}
        />
        
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addItem}
              className={isMobile ? "text-xs px-3 py-2" : ""}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Item
            </Button>
            
            <CategoryItemSelector 
              open={false}
              onOpenChange={() => {}}
              onSelectItems={(selectedItems) => {
                const newItems = selectedItems.map(selectedItem => {
                  const newId = Math.max(...items.map(item => item.id), 0) + 1 + selectedItems.indexOf(selectedItem);
                  return {
                    id: newId,
                    description: selectedItem.description,
                    category: selectedItem.category || "",
                    quantity: selectedItem.quantity,
                    unit: selectedItem.unit,
                    unitPrice: selectedItem.price,
                    amount: selectedItem.quantity * selectedItem.price
                  };
                });
                setItems(prevItems => [...prevItems, ...newItems]);
              }}
            />
          </div>
        </div>
        
        {/* Summary Section */}
        <div className="border-t pt-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              {documentType === 'quotation' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="requiresDeposit"
                        checked={depositInfo.requiresDeposit}
                        onChange={(e) => setDepositInfo({
                          ...depositInfo,
                          requiresDeposit: e.target.checked
                        })}
                        className="h-4 w-4"
                      />
                      <label htmlFor="requiresDeposit" className="text-sm">
                        Requires Deposit
                      </label>
                    </div>
                    
                    {depositInfo.requiresDeposit && (
                      <div className="space-y-2 ml-6">
                        <div className="flex items-center gap-2">
                          <label className="text-xs">Percentage:</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={depositInfo.depositPercentage}
                            onChange={(e) => {
                              const percentage = parseFloat(e.target.value) || 0;
                              setDepositInfo({
                                ...depositInfo,
                                depositPercentage: percentage,
                                depositAmount: subtotal * (percentage / 100)
                              });
                            }}
                            className="w-16 px-2 py-1 text-xs border rounded"
                          />
                          <span className="text-xs">%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Deposit ({depositInfo.depositPercentage}%):</span>
                          <span>{formatCurrency(depositAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
