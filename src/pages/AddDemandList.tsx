import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { inventoryService, InventoryItem } from "@/services/inventoryService";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AddDemandList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requested_date: new Date().toISOString().split('T')[0],
    required_date: "",
    status: "Draft" as const,
    priority: "Normal" as const,
    requested_by: "",
    notes: ""
  });

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    try {
      const items = await inventoryService.getLowStockItems();
      setLowStockItems(items);
      // Auto-suggest title if creating from low stock items
      if (items.length > 0 && !formData.title) {
        setFormData(prev => ({
          ...prev,
          title: "Low Stock Replenishment",
          description: `Demand list for ${items.length} low stock items`
        }));
        // Auto-select all low stock items
        setSelectedItems(items.map(item => item.id));
      }
    } catch (error) {
      console.error("Error fetching low stock items:", error);
    }
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the demand list
      const demandList = await inventoryService.createDemandList(formData);
      
      // Add selected low stock items to the demand list
      for (const itemId of selectedItems) {
        const item = lowStockItems.find(i => i.id === itemId);
        if (item) {
          const suggestedQuantity = Math.max(
            (item.max_stock_level || item.min_stock_level || 10) - item.quantity,
            1
          );
          
          await inventoryService.createDemandListItem({
            demand_list_id: demandList.id,
            inventory_item_id: itemId,
            item_name: item.name,
            description: `Restock for low inventory (Current: ${item.quantity}, Min: ${item.min_stock_level})`,
            quantity: suggestedQuantity,
            unit_price: item.unit_price || 0,
            amount: (item.unit_price || 0) * suggestedQuantity,
            notes: `Auto-generated from low stock alert`
          });
        }
      }
      
      toast({
        title: "Success",
        description: `Demand list created successfully with ${selectedItems.length} items`
      });
      
      navigate("/inventory");
    } catch (error: any) {
      console.error("Error creating demand list:", error);
      toast({
        title: "Error",
        description: "Failed to create demand list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${isMobile ? 'page-container' : 'pt-4'}`}>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requested_by">Requested By</Label>
                <Input
                  id="requested_by"
                  value={formData.requested_by}
                  onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requested_date">Requested Date *</Label>
                <Input
                  id="requested_date"
                  type="date"
                  value={formData.requested_date}
                  onChange={(e) => setFormData({ ...formData, requested_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="required_date">Required Date</Label>
                <Input
                  id="required_date"
                  type="date"
                  value={formData.required_date}
                  onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {lowStockItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Low Stock Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItems(
                      selectedItems.length === lowStockItems.length 
                        ? [] 
                        : lowStockItems.map(item => item.id)
                    )}
                  >
                    {selectedItems.length === lowStockItems.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  <div className="space-y-3">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={item.id}
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => handleItemToggle(item.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
                                {item.name}
                              </label>
                              <p className="text-xs text-gray-500">
                                Current: {item.quantity} | Min: {item.min_stock_level || 0}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-red-600">Low Stock</div>
                              <div className="text-xs text-gray-500">
                                Need: {Math.max((item.max_stock_level || item.min_stock_level || 10) - item.quantity, 1)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedItems.length} of {lowStockItems.length} items selected
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate("/inventory")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Demand List"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}