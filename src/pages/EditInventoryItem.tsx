import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryService, InventoryItem } from "@/services/inventoryService";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function EditInventoryItem() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    category: "",
    quantity: 0,
    min_stock_level: 0,
    max_stock_level: "",
    unit_price: "",
    supplier: "",
    supplier_contact: "",
    location: "",
    status: "Active" as 'Active' | 'Inactive' | 'Discontinued'
  });

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      setInitialLoading(true);
      const item = await inventoryService.getItemById(id!);
      if (item) {
        setFormData({
          name: item.name,
          description: item.description || "",
          sku: item.sku || "",
          category: item.category || "",
          quantity: item.quantity,
          min_stock_level: item.min_stock_level || 0,
          max_stock_level: item.max_stock_level?.toString() || "",
          unit_price: item.unit_price?.toString() || "",
          supplier: item.supplier || "",
          supplier_contact: item.supplier_contact || "",
          location: item.location || "",
          status: item.status
        });
      }
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory item",
        variant: "destructive"
      });
      navigate("/inventory");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        max_stock_level: formData.max_stock_level ? parseInt(formData.max_stock_level) : undefined,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined,
      };

      await inventoryService.updateItem(id!, updateData);
      
      toast({
        title: "Success",
        description: "Inventory item updated successfully"
      });
      
      navigate("/inventory");
    } catch (error) {
      console.error("Error updating inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'page-container' : 'mt-6'}`}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/inventory")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
          <CardDescription>Update the details for this inventory item</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Stock Keeping Unit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Current Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
                  min="0"
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
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

              <div className="space-y-2">
                <Label htmlFor="location">Storage Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Warehouse, shelf, etc."
                />
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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate("/inventory")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Item"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}