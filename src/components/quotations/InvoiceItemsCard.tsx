
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, FolderSearch, Wallet } from "lucide-react";
import { ItemsTable } from "./ItemsTable";
import { CategoryItemSelector, SelectedItem } from "@/components/quotations/CategoryItemSelector";
import { InvoiceItem } from "./types";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface InvoiceItemsCardProps {
  items: InvoiceItem[];
  setItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
  isDepositInvoice: boolean;
  setIsDepositInvoice: React.Dispatch<React.SetStateAction<boolean>>;
  depositAmount: number;
  setDepositAmount: React.Dispatch<React.SetStateAction<number>>;
  depositPercentage: number;
  setDepositPercentage: React.Dispatch<React.SetStateAction<number>>;
  calculateItemAmount: (item: InvoiceItem) => number;
}

export function InvoiceItemsCard({ 
  items, 
  setItems, 
  isDepositInvoice,
  setIsDepositInvoice,
  depositAmount,
  setDepositAmount,
  depositPercentage,
  setDepositPercentage,
  calculateItemAmount
}: InvoiceItemsCardProps) {
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const isMobile = useIsMobile();
  
  const handleItemChange = (id: number, field: keyof InvoiceItem, value: any) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          updatedItem.amount = calculateItemAmount(updatedItem);
          return updatedItem;
        }
        return item;
      })
    );
  };

  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    setItems([...items, { id: newId, description: "", quantity: 1, unit: "Unit", unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTotal = () => {
    // If this is a deposit invoice, return only the deposit amount
    if (isDepositInvoice) {
      return depositAmount;
    }
    return calculateSubtotal();
  };

  const handleDepositPercentageChange = (value: number) => {
    setDepositPercentage(value);
    setDepositAmount(calculateSubtotal() * (value / 100));
  };

  const handleDepositAmountChange = (value: number) => {
    setDepositAmount(value);
    // Update percentage based on the amount
    const subtotal = calculateSubtotal();
    if (subtotal > 0) {
      setDepositPercentage((value / subtotal) * 100);
    }
  };

  useEffect(() => {
    // Update deposit amount when total changes
    if (isDepositInvoice) {
      setDepositAmount(calculateSubtotal() * (depositPercentage / 100));
    }
  }, [items, isDepositInvoice]);

  const handleItemsFromCategories = (selectedItems: SelectedItem[]) => {
    // Convert selected items to invoice items format
    const newItems = selectedItems.map((selectedItem, index) => ({
      id: items.length > 0 ? Math.max(...items.map(item => item.id)) + index + 1 : index + 1,
      description: selectedItem.description,
      quantity: selectedItem.quantity,
      unit: selectedItem.unit,
      unitPrice: selectedItem.price,
      amount: selectedItem.quantity * selectedItem.price
    }));

    // Add the new items to the existing items
    setItems([...items, ...newItems]);
    
    toast({
      title: "Items Added",
      description: `${newItems.length} item(s) have been added to the invoice.`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Invoice Items</CardTitle>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isDepositInvoice" 
              checked={isDepositInvoice}
              onCheckedChange={(checked) => setIsDepositInvoice(!!checked)}
            />
            <label
              htmlFor="isDepositInvoice"
              className="text-sm font-medium flex items-center cursor-pointer"
            >
              <Wallet className="h-4 w-4 mr-1" />
              Deposit Invoice
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`flex ${isMobile ? "flex-col" : "flex-wrap"} gap-2 mb-4`}>
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className={isMobile ? "w-full" : ""}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCategorySelector(true)}
              className={isMobile ? "w-full" : ""}
            >
              <FolderSearch className="mr-2 h-4 w-4" />
              Select from Categories
            </Button>
          </div>

          <ItemsTable
            items={items}
            handleItemChange={handleItemChange}
            removeItem={removeItem}
          />
          
          <div className={`flex ${isMobile ? "flex-col" : "justify-end"} mt-6`}>
            <div className={isMobile ? "w-full" : "w-72"}>
              <div className="flex justify-between py-2">
                <span className="font-medium">Subtotal:</span>
                <span>RM {calculateSubtotal().toFixed(2)}</span>
              </div>

              {/* Deposit Section */}
              {isDepositInvoice && (
                <div className="space-y-2 border-t pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="depositPercentage" className="text-xs">Deposit (%)</Label>
                      <div className="relative">
                        <Input
                          id="depositPercentage"
                          type="number"
                          min="0"
                          max="100"
                          value={depositPercentage.toFixed(0)}
                          onChange={(e) => handleDepositPercentageChange(parseFloat(e.target.value))}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="depositAmount" className="text-xs">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                        <Input
                          id="depositAmount"
                          type="number"
                          min="0"
                          value={depositAmount.toFixed(2)}
                          onChange={(e) => handleDepositAmountChange(parseFloat(e.target.value))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span>Balance Due (Future Invoice):</span>
                    <span>RM {(calculateSubtotal() - depositAmount).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between py-2 border-t">
                <span className="font-semibold text-lg">Total:</span>
                <span className="font-semibold text-lg">RM {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CategoryItemSelector
        open={showCategorySelector}
        onOpenChange={setShowCategorySelector}
        onSelectItems={handleItemsFromCategories}
      />
    </>
  );
}
