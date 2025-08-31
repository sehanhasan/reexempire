import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderOpen, Wallet } from "lucide-react";
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
  quotationDepositAmount?: number;
  showDepositPaid?: boolean;
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
  calculateItemAmount,
  quotationDepositAmount,
  showDepositPaid = false
}: InvoiceItemsCardProps) {
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const isMobile = useIsMobile();
  const handleItemChange = (id: number, field: keyof InvoiceItem, value: any) => {
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
      category: "Other Items",
      quantity: 1,
      unit: "",
      unitPrice: 0,
      amount: 0
    }]);
  };

  const addItemToCategory = (category: string) => {
    const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    setItems([...items, {
      id: newId,
      description: "",
      category: category,
      quantity: 1,
      unit: "",
      unitPrice: 0,
      amount: 0
    }]);
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
    const subtotal = calculateSubtotal();
    if (subtotal > 0) {
      setDepositPercentage(value / subtotal * 100);
    }
  };

  // Handle deposit invoice checkbox change
  const handleDepositInvoiceChange = (checked: boolean) => {
    setIsDepositInvoice(checked);
    if (checked && depositPercentage === 30) {
      // Set default to 50% if not set already
      setDepositPercentage(50);
      setDepositAmount(calculateSubtotal() * 0.5);
    }
  };
  const handleItemsFromCategories = (selectedItems: SelectedItem[]) => {
    const newItems = selectedItems.map((selectedItem, index) => ({
      id: items.length > 0 ? Math.max(...items.map(item => item.id)) + index + 1 : index + 1,
      description: selectedItem.description,
      category: selectedItem.category || "Other Items",
      quantity: selectedItem.quantity,
      unit: selectedItem.unit,
      unitPrice: selectedItem.price,
      amount: selectedItem.quantity * selectedItem.price
    }));
    setItems([...items, ...newItems]);
    toast({
      title: "Items Added",
      description: `${newItems.length} item(s) have been added to the invoice.`
    });
  };
  return <>
      <Card className="shadow-sm">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-4">
            <CardTitle className="text-lg text-cyan-600">Invoice Items</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox id="isDepositInvoice" checked={isDepositInvoice} onCheckedChange={handleDepositInvoiceChange} />
              <label htmlFor="isDepositInvoice" className="text-sm font-medium flex items-center cursor-pointer">
                <Wallet className="h-4 w-4 mr-1" />
                Deposit Invoice
              </label>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="py-3 px-4">
          <div className={`flex ${isMobile ? "flex-col" : "flex-wrap"} gap-2 mb-3`}>
            <Button type="button" variant="outline" onClick={addItem} className={`${isMobile ? "w-full" : ""} text-sm h-10`}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Item
            </Button>
            
            <Button type="button" onClick={() => setShowCategorySelector(true)} className={`${isMobile ? "w-full" : ""} text-sm h-10 bg-blue-600 hover:bg-blue-700 text-white`}>
              <FolderOpen className="mr-1 h-3.5 w-3.5" />
              Select from Categories
            </Button>
          </div>

          <ItemsTable items={items} handleItemChange={handleItemChange} removeItem={removeItem} addItemToCategory={addItemToCategory} showDescription={true} />
          
          <div className={`flex ${isMobile ? "flex-col" : "justify-end"} mt-4`}>
            <div className={isMobile ? "w-full" : "w-72 bg-gray-50 p-3 rounded-lg"}>
              <div className="flex justify-between py-1.5 text-sm">
                <span className="font-medium">Subtotal:</span>
                <span>RM {calculateSubtotal().toFixed(2)}</span>
              </div>

              {showDepositPaid && quotationDepositAmount && quotationDepositAmount > 0 && !isDepositInvoice && <div className="flex justify-between py-1 text-sm text-muted-foreground border-t pt-1">
                  <span>Amount Paid:</span>
                  <span>RM {quotationDepositAmount.toFixed(2)}</span>
                </div>}

              {isDepositInvoice && <div className="space-y-2 border-t pt-2 mt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="depositPercentage" className="text-xs">Deposit (%)</Label>
                      <div className="relative">
                        <Input id="depositPercentage" type="number" min="0" max="100" value={depositPercentage.toFixed(0)} onChange={e => handleDepositPercentageChange(parseFloat(e.target.value))} className="pr-7 h-10 text-sm" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="depositAmount" className="text-xs">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">RM</span>
                        <Input id="depositAmount" type="number" min="0" value={depositAmount.toFixed(2)} onChange={e => handleDepositAmountChange(parseFloat(e.target.value))} className="pl-8 h-10 text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span>Balance Due:</span>
                    <span>RM {(calculateSubtotal() - depositAmount).toFixed(2)}</span>
                  </div>
                </div>}

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