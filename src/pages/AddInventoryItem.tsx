import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryService } from "@/services/inventoryService";
import { inventoryCategoryService, InventoryCategory } from "@/services/inventoryCategoryService";
import { AddInventoryCategoryDialog } from "@/components/inventory/AddInventoryCategoryDialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AddInventoryItem() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await inventoryCategoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching inventory categories:", error);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    category: "",
    quantity: "",
    min_stock_level: "",
    max_stock_level: "",
    unit_price: "",
    supplier: "",
    supplier_contact: "",
    location: "",
    status: "Active" as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemData = {
        ...formData,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0,
        min_stock_level: formData.min_stock_level ? parseInt(formData.min_stock_level) : 0,
        max_stock_level: formData.max_stock_level ? parseInt(formData.max_stock_level) : undefined,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined,
      };

      await inventoryService.createItem(itemData);
      
      toast({
        title: "Success",
        description: "Inventory item added successfully"
      });
      
      navigate("/inventory");
    } catch (error: any) {
      console.error("Error creating inventory item:", error);
      const rawMessage = error?.message || String(error);
      const description = rawMessage.includes("inventory_items_sku_key")
        ? "SKU already exists. Please use a unique SKU."
        : rawMessage || "Failed to add inventory item";
      toast({
        title: "Error",
        description,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${isMobile ? 'page-container' : 'pt-4'}`}>
      <Card className="pt-6">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-cyan-600 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active" className="text-green-600 focus:text-green-600">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Active
                        </span>
                      </SelectItem>
                      <SelectItem value="Inactive" className="text-yellow-600 focus:text-yellow-600">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          Inactive
                        </span>
                      </SelectItem>
                      <SelectItem value="Discontinued" className="text-red-600 focus:text-red-600">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Discontinued
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="category">Inventory Category *</Label>
                    <AddInventoryCategoryDialog onCategoryAdded={fetchCategories} />
                  </div>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Stock Management Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-cyan-600 border-b pb-2">Stock Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Current Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_stock_level">Maximum Stock Level</Label>
                  <Input
                    id="max_stock_level"
                    type="number"
                    value={formData.max_stock_level}
                    onChange={(e) => setFormData({ ...formData, max_stock_level: e.target.value })}
                    min="0"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            {/* Supplier & Pricing Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-cyan-600 border-b pb-2">Supplier & Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    min="0"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Storage Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Warehouse, shelf, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Supplier name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier_contact">Supplier Contact</Label>
                  <Input
                    id="supplier_contact"
                    value={formData.supplier_contact}
                    onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                    placeholder="Phone or email"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate("/inventory")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}