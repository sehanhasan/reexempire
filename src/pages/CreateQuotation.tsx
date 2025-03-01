
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  X, 
  Plus, 
  Save, 
  ArrowLeft, 
  FolderSearch, 
  Wallet 
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { CategoryItemSelector, SelectedItem } from "@/components/quotations/CategoryItemSelector";
import { Checkbox } from "@/components/ui/checkbox";

interface QuotationItem {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export default function CreateQuotation() {
  const navigate = useNavigate();
  const [items, setItems] = useState<QuotationItem[]>([
    { id: 1, description: "", quantity: 1, unit: "Unit", unitPrice: 0, amount: 0 }
  ]);

  const [customer, setCustomer] = useState("");
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [requiresDeposit, setRequiresDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositPercentage, setDepositPercentage] = useState(30); // Default 30%

  // Sample customers for the demo
  const customers = [
    { id: "C001", name: "Alice Johnson" },
    { id: "C002", name: "Bob Smith" },
    { id: "C003", name: "Carol Williams" },
    { id: "C004", name: "David Brown" },
    { id: "C005", name: "Eva Davis" },
  ];

  const calculateItemAmount = (item: QuotationItem) => {
    return item.quantity * item.unitPrice;
  };

  const handleItemChange = (id: number, field: keyof QuotationItem, value: any) => {
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

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const updateDepositFromPercentage = () => {
    const total = calculateTotal();
    setDepositAmount(total * (depositPercentage / 100));
  };

  // Update deposit amount when total or percentage changes
  useState(() => {
    updateDepositFromPercentage();
  });

  const handleDepositPercentageChange = (value: number) => {
    setDepositPercentage(value);
    setDepositAmount(calculateTotal() * (value / 100));
  };

  const handleDepositAmountChange = (value: number) => {
    setDepositAmount(value);
    // Update percentage based on the amount
    const total = calculateTotal();
    if (total > 0) {
      setDepositPercentage((value / total) * 100);
    }
  };

  const handleItemsFromCategories = (selectedItems: SelectedItem[]) => {
    // Convert selected items to quotation items format
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
      description: `${newItems.length} item(s) have been added to the quotation.`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would save to the database
    toast({
      title: "Quotation Created",
      description: `Quotation for ${customer} has been created successfully.`,
    });
    
    // Navigate back to the quotations list
    navigate("/quotations");
  };

  const handleConvertToInvoice = () => {
    // In a real app, this would create an invoice from the quotation data
    // For this demo, we'll just navigate to the invoice creation page
    toast({
      title: "Convert to Invoice",
      description: "This would convert the quotation to an invoice in a real app.",
    });
    
    navigate("/invoices/create");
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Create Quotation"
        description="Create a new quotation for a customer."
        actions={
          <Button variant="outline" onClick={() => navigate("/quotations")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quotations
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select 
                  value={customer} 
                  onValueChange={setCustomer}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quotationDate">Quotation Date</Label>
                <Input
                  id="quotationDate"
                  type="date"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quotationNumber">Quotation Number</Label>
                <Input
                  id="quotationNumber"
                  placeholder="QT-0001"
                  defaultValue="QT-0001"
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quotation Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={addItem}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCategorySelector(true)}
              >
                <FolderSearch className="mr-2 h-4 w-4" />
                Select from Categories
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 text-left font-medium">Description</th>
                    <th className="py-3 px-4 text-center font-medium w-20">Qty</th>
                    <th className="py-3 px-4 text-center font-medium w-24">Unit</th>
                    <th className="py-3 px-4 text-right font-medium w-32">Unit Price</th>
                    <th className="py-3 px-4 text-right font-medium w-32">Amount</th>
                    <th className="py-3 px-4 text-center font-medium w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4">
                        <Input
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                          required
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value))}
                          required
                          className="text-center"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={item.unit}
                          onValueChange={(value) => handleItemChange(item.id, "unit", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Unit">Unit</SelectItem>
                            <SelectItem value="Hour">Hour</SelectItem>
                            <SelectItem value="Day">Day</SelectItem>
                            <SelectItem value="Meter">Meter</SelectItem>
                            <SelectItem value="Sq.m">Sq.m</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(item.id, "unitPrice", parseFloat(e.target.value))}
                            required
                            className="text-right pl-10"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">RM</span>
                          <Input
                            type="number"
                            value={item.amount.toFixed(2)}
                            disabled
                            className="text-right pl-10"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                          disabled={items.length <= 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end mt-6">
              <div className="w-72 space-y-4">
                <div className="flex justify-between py-2">
                  <span className="font-medium">Subtotal:</span>
                  <span>RM {calculateTotal().toFixed(2)}</span>
                </div>

                {/* Deposit Section */}
                <div className="border-t pt-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id="requiresDeposit" 
                      checked={requiresDeposit}
                      onCheckedChange={(checked) => setRequiresDeposit(!!checked)}
                    />
                    <label
                      htmlFor="requiresDeposit"
                      className="text-sm font-medium flex items-center cursor-pointer"
                    >
                      <Wallet className="h-4 w-4 mr-1" />
                      Require Deposit Payment
                    </label>
                  </div>
                  
                  {requiresDeposit && (
                    <div className="space-y-2 ml-6">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="depositPercentage" className="text-xs">Percentage</Label>
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
                        <span>Balance Due:</span>
                        <span>RM {(calculateTotal() - depositAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between py-2 border-t">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="font-semibold text-lg">RM {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes/Terms</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional notes or terms and conditions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between space-x-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={handleConvertToInvoice}
              className="text-blue-600"
            >
              Convert to Invoice
            </Button>
            
            <div className="space-x-2">
              <Button variant="outline" type="button" onClick={() => navigate("/quotations")}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Quotation
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>

      <CategoryItemSelector
        open={showCategorySelector}
        onOpenChange={setShowCategorySelector}
        onSelectItems={handleItemsFromCategories}
      />
    </div>
  );
}
