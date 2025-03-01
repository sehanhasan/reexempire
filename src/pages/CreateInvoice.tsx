
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Receipt,
  Wallet
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { CategoryItemSelector, SelectedItem } from "@/components/quotations/CategoryItemSelector";
import { Checkbox } from "@/components/ui/checkbox";

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: "", quantity: 1, unit: "Unit", unitPrice: 0, amount: 0 }
  ]);

  const [customer, setCustomer] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [notes, setNotes] = useState("");
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [isDepositInvoice, setIsDepositInvoice] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositPercentage, setDepositPercentage] = useState(30); // Default 30%
  const [quotationReference, setQuotationReference] = useState("");

  // Check if this invoice is being created from a quotation
  useEffect(() => {
    // In a real app, you would get the quotation ID from the URL or state
    // and then fetch the quotation data from the API
    const fromQuotation = location.state?.fromQuotation;
    if (fromQuotation) {
      // Populate invoice with quotation data
      // This is just a demo placeholder
      setQuotationReference("QT-0001");
      toast({
        title: "Created from Quotation",
        description: "Invoice has been pre-filled with quotation data.",
      });
    }
  }, [location]);

  // Sample customers for the demo
  const customers = [
    { id: "C001", name: "Alice Johnson" },
    { id: "C002", name: "Bob Smith" },
    { id: "C003", name: "Carol Williams" },
    { id: "C004", name: "David Brown" },
    { id: "C005", name: "Eva Davis" },
  ];

  const calculateItemAmount = (item: InvoiceItem) => {
    return item.quantity * item.unitPrice;
  };

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

  const calculateTax = () => {
    // If this is a deposit invoice, only apply tax to the deposit amount
    if (isDepositInvoice) {
      return depositAmount * 0.06; // 6% SST in Malaysia
    }
    return calculateSubtotal() * 0.06; // 6% SST in Malaysia
  };

  const calculateTotal = () => {
    // If this is a deposit invoice, return only the deposit amount + tax
    if (isDepositInvoice) {
      return depositAmount + calculateTax();
    }
    return calculateSubtotal() + calculateTax();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would save to the database
    toast({
      title: "Invoice Created",
      description: `Invoice for ${customer} has been created successfully.`,
    });
    
    // Navigate back to the invoices list
    navigate("/invoices");
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Create Invoice"
        description="Create a new invoice for a customer."
        actions={
          <Button variant="outline" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
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
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="INV-0001"
                  defaultValue="INV-0001"
                  disabled
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select 
                  value={paymentMethod} 
                  onValueChange={setPaymentMethod}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {quotationReference && (
              <div className="pt-2">
                <div className="flex items-center text-blue-600">
                  <Receipt className="h-4 w-4 mr-2" />
                  <span className="text-sm">Created from Quotation: <strong>{quotationReference}</strong></span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
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
              <div className="w-72 space-y-2">
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

                <div className="flex justify-between py-2 border-t border-b">
                  <span className="font-medium">SST (6%):</span>
                  <span>RM {calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="font-semibold text-lg">RM {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-medium text-blue-700 mb-2">Bank Details</h3>
                <p className="text-sm text-blue-800">
                  Bank: MayBank<br />
                  Account Name: RenovateProX Sdn Bhd<br />
                  Account Number: 1234 5678 9012<br />
                  Swift Code: MBBEMYKL
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any additional information..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" type="button" onClick={() => navigate("/invoices")}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
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
