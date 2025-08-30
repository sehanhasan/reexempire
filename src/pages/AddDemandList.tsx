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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const generateDemandListPDF = async (demandList: any, items: InventoryItem[]) => {
    const doc = new jsPDF();
    
    // Company Logo/Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('DEMAND LIST', 20, 25);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    // Document info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Document Information', 20, 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Title: ${demandList.title}`, 20, 75);
    doc.text(`Requested Date: ${new Date(demandList.requested_date).toLocaleDateString()}`, 20, 85);
    doc.text(`Priority: ${demandList.priority}`, 20, 95);
    if (demandList.required_date) {
      doc.text(`Required Date: ${new Date(demandList.required_date).toLocaleDateString()}`, 20, 105);
    }
    if (demandList.requested_by) {
      doc.text(`Requested By: ${demandList.requested_by}`, 20, 115);
    }
    
    if (demandList.description) {
      doc.text(`Description: ${demandList.description}`, 20, 125);
    }

    // Items table
    const tableData = items.map(item => [
      item.name,
      item.quantity.toString(),
      item.min_stock_level?.toString() || '0',
      Math.max((item.max_stock_level || item.min_stock_level || 10) - item.quantity, 1).toString(),
      item.unit_price ? `$${item.unit_price.toFixed(2)}` : '-'
    ]);

    const totalValue = items.reduce((sum, item) => {
      const requiredQty = Math.max((item.max_stock_level || item.min_stock_level || 10) - item.quantity, 1);
      return sum + (requiredQty * (item.unit_price || 0));
    }, 0);

    autoTable(doc, {
      head: [['Item Name', 'Current Stock', 'Min Level', 'Required Qty', 'Unit Price']],
      body: tableData,
      startY: 140,
      theme: 'striped',
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 20, right: 20 }
    });

    // Add total at the bottom
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Estimated Value: $${totalValue.toFixed(2)}`, 20, finalY);
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, finalY + 20);
    doc.text('This is a system-generated document', 20, finalY + 30);

    // Download the PDF
    doc.save(`demand-list-${demandList.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure required_date is not empty string
      const submitData = {
        ...formData,
        status: "Draft" as const,
        required_date: formData.required_date || null
      };
      
      // Create the demand list
      const demandList = await inventoryService.createDemandList(submitData);
      
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

      // Generate and download PDF
      await generateDemandListPDF(demandList, selectedItems.map(id => lowStockItems.find(item => item.id === id)).filter(Boolean));
      
      toast({
        title: "Success",
        description: `Demand list created successfully with ${selectedItems.length} items and PDF downloaded`
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