
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderOpen, Wallet } from "lucide-react";
import { ItemsTable } from "./ItemsTable";
import { CategoryItemSelector, SelectedItem } from "@/components/quotations/CategoryItemSelector";
import { QuotationItem, DepositInfo } from "./types";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface QuotationItemsCardProps {
  items: QuotationItem[];
  setItems: React.Dispatch<React.SetStateAction<QuotationItem[]>>;
  depositInfo: DepositInfo;
  setDepositInfo: React.Dispatch<React.SetStateAction<DepositInfo>>;
  calculateItemAmount: (item: QuotationItem) => number;
}

export function QuotationItemsCard({
  items,
  setItems,
  depositInfo,
  setDepositInfo,
  calculateItemAmount
}: QuotationItemsCardProps) {
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const isMobile = useIsMobile();
  
  const handleItemChange = (id: number, field: keyof QuotationItem, value: any) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const updatedItem = {
          ...item,
          [field]: value
        };
        updatedItem.amount = calculateItemAmount(updatedItem);
        return updatedItem;
      }
      return item;
    }));
  };
  
  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    setItems([...items, {
      id: newId,
      description: "",
      category: "",
      quantity: 1,
      unit: "Unit",
      unitPrice: 0,
      amount: 0
    }]);
  };
  
  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };
  
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };
  
  const handleDepositPercentageChange = (value: number) => {
    setDepositInfo({
      ...depositInfo,
      depositPercentage: value,
      depositAmount: calculateTotal() * (value / 100)
    });
  };
  
  const handleDepositAmountChange = (value: number) => {
    const total = calculateTotal();
    setDepositInfo({
      ...depositInfo,
      depositAmount: value,
      depositPercentage: total > 0 ? value / total * 100 : 0
    });
  };
  
  const handleItemsFromCategories = (selectedItems: SelectedItem[]) => {
    const newItems = selectedItems.map((selectedItem, index) => ({
      id: items.length > 0 ? Math.max(...items.map(item => item.id)) + index + 1 : index + 1,
      description: selectedItem.description,
      category: selectedItem.category || "",
      quantity: selectedItem.quantity,
      unit: selectedItem.unit,
      unitPrice: selectedItem.price,
      amount: selectedItem.quantity * selectedItem.price
    }));
    setItems([...items, ...newItems]);
    toast({
      title: "Items Added",
      description: `${newItems.length} item(s) have been added to the quotation.`
    });
  };
  
  return <>
      <Card className="shadow-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-lg text-cyan-600">Quotation Items</CardTitle>
        </CardHeader>
        <CardContent className="py-3 px-4">
          <div className={`flex ${isMobile ? "flex-col" : "flex-wrap"} gap-2 mb-3`}>
            <Button type="button" variant="outline" onClick={addItem} className={`${isMobile ? "w-full" : ""} text-sm h-10`}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Item
            </Button>
            
            <Button type="button" variant="outline" onClick={() => setShowCategorySelector(true)} className={`${isMobile ? "w-full" : ""} text-sm h-10`}>
              <FolderOpen className="mr-1 h-3.5 w-3.5" />
              Select from Categories
            </Button>
          </div>

          <ItemsTable items={items} handleItemChange={handleItemChange} removeItem={removeItem} showDescription={true} />
          
          <div className={`flex ${isMobile ? "flex-col" : "justify-end"} mt-4`}>
            <div className={isMobile ? "w-full" : "w-72"}>
              <div className="flex justify-between py-1.5 text-sm">
                <span className="font-medium">Subtotal:</span>
                <span>RM {calculateTotal().toFixed(2)}</span>
              </div>

              {/* Deposit Section */}
              <div className="border-t pt-2 mt-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox id="requiresDeposit" checked={depositInfo.requiresDeposit} onCheckedChange={checked => setDepositInfo({
                  ...depositInfo,
                  requiresDeposit: !!checked,
                  depositPercentage: 0,
                  depositAmount: 0
                })} />
                  <label htmlFor="requiresDeposit" className="text-sm font-medium flex items-center cursor-pointer">
                    <Wallet className="h-3.5 w-3.5 mr-1" />
                    Require Deposit Payment
                  </label>
                </div>
                
                {depositInfo.requiresDeposit && <div className="space-y-2 ml-6">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="depositPercentage" className="text-xs">Percentage</Label>
                        <div className="relative">
                          <Input id="depositPercentage" type="number" min="0" max="100" value={depositInfo.depositPercentage || ""} onChange={e => handleDepositPercentageChange(parseFloat(e.target.value) || 0)} className="pr-7 h-10 text-sm" />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="depositAmount" className="text-xs">Amount</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">RM</span>
                          <Input id="depositAmount" type="number" min="0" value={depositInfo.depositAmount.toFixed(2)} onChange={e => handleDepositAmountChange(parseFloat(e.target.value))} className="pl-8 h-10 text-sm" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm py-1">
                      <span>Balance Due:</span>
                      <span>RM {(calculateTotal() - depositInfo.depositAmount).toFixed(2)}</span>
                    </div>
                  </div>}
              </div>

              <div className="flex justify-between py-2 border-t mt-1">
                <span className="font-semibold text-base">Total:</span>
                <span className="font-semibold text-base">RM {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CategoryItemSelector open={showCategorySelector} onOpenChange={setShowCategorySelector} onSelectItems={handleItemsFromCategories} />
    </>;
}
