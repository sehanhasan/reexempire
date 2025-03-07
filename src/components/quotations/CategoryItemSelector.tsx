
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categoryService } from "@/services/categoryService";
import { Category, Subcategory } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export interface SelectedItem {
  id: string;
  description: string;
  category?: string;
  quantity: number;
  unit: string;
  price: number;
}

interface CategoryItemSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItems: (selectedItems: SelectedItem[]) => void;
}

export function CategoryItemSelector({
  open,
  onOpenChange,
  onSelectItems
}: CategoryItemSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        // Get all categories with their subcategories
        const categoriesData = await categoryService.getAll();
        
        // For each category, fetch its subcategories
        const categoriesWithSubcategories = await Promise.all(
          categoriesData.map(async (category) => {
            const subcategories = await categoryService.getSubcategoriesByCategoryId(category.id);
            return {
              ...category,
              subcategories: subcategories || []
            };
          })
        );
        
        setCategories(categoriesWithSubcategories);
        setError("");
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    if (open) {
      fetchCategories();
    } else {
      setSelectedItems([]);
    }
  }, [open]);
  
  const handleSelectItem = (item: Subcategory, categoryName: string) => {
    const itemId = item.id || '';
    
    // Check if the item is already selected
    const isSelected = selectedItems.some(selected => selected.id === itemId);
    
    if (isSelected) {
      // Remove the item from selected items
      setSelectedItems(selectedItems.filter(selected => selected.id !== itemId));
    } else {
      // Add the item to selected items
      const newItem: SelectedItem = {
        id: itemId,
        description: item.name,
        category: categoryName,
        quantity: 1,
        unit: "Unit", // Default unit
        price: item.price || 0
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };
  
  const handleQuantityChange = (id: string, quantity: number) => {
    setSelectedItems(
      selectedItems.map(item => 
        item.id === id 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  const handleAddSelectedItems = () => {
    onSelectItems(selectedItems);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Select Items from Categories</DialogTitle>
          <DialogDescription>
            Select items from categories to add to your document.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="py-6 text-center">Loading categories...</div>
        ) : error ? (
          <div className="py-6 text-center text-red-500">{error}</div>
        ) : (
          <div className="py-2 space-y-4">
            {categories.length === 0 ? (
              <div className="py-6 text-center">No categories available.</div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <h3 className="font-semibold text-md border-b pb-1">{category.name}</h3>
                  
                  {category.subcategories && category.subcategories.length > 0 ? (
                    <div className="space-y-2">
                      {category.subcategories.map((subcategory) => (
                        <div key={subcategory.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-slate-50">
                          <div className="flex items-center">
                            <Checkbox 
                              id={`item-${subcategory.id}`}
                              checked={selectedItems.some(item => item.id === subcategory.id)}
                              onCheckedChange={() => handleSelectItem(subcategory, category.name)}
                              className="mr-2"
                            />
                            <Label htmlFor={`item-${subcategory.id}`} className="flex-1 cursor-pointer">
                              <div>
                                <span className="font-medium">{subcategory.name}</span>
                                {subcategory.description && (
                                  <p className="text-sm text-muted-foreground">{subcategory.description}</p>
                                )}
                              </div>
                            </Label>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-sm font-semibold mr-4">RM {subcategory.price || 0}</span>
                            
                            {selectedItems.some(item => item.id === subcategory.id) && (
                              <div className="w-20">
                                <Input 
                                  type="number" 
                                  min="1"
                                  value={selectedItems.find(item => item.id === subcategory.id)?.quantity || 1}
                                  onChange={(e) => handleQuantityChange(subcategory.id || '', parseInt(e.target.value) || 1)}
                                  className="h-8 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground py-2">No items in this category.</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        
        <DialogFooter className="flex justify-between items-center mt-4">
          <div className="text-sm">
            Selected items: <span className="font-semibold">{selectedItems.length}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddSelectedItems}
              disabled={selectedItems.length === 0}
            >
              Add Selected Items
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
