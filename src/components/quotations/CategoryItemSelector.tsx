
import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { categoryService } from "@/services";
import { Category, CategoryItem } from "@/types/database";
import { X, Minus, Plus, FolderCheck, Search } from "lucide-react";

export interface SelectedItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
}

interface CategoryItemSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItems: (items: SelectedItem[]) => void;
}

export function CategoryItemSelector({
  open,
  onOpenChange,
  onSelectItems
}: CategoryItemSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryItems, setCategoryItems] = useState<Record<string, CategoryItem[]>>({});
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchCategories();
      // Reset state when opening
      setSelectedItems([]);
      setSearchQuery("");
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
      
      // Fetch items for each category
      const itemsRecord: Record<string, CategoryItem[]> = {};
      for (const category of data) {
        const items = await categoryService.getItemsByCategoryId(category.id);
        itemsRecord[category.id] = items;
      }
      setCategoryItems(itemsRecord);
      
      // Expand all categories by default if there are only a few
      if (data.length <= 5) {
        setExpandedCategories(data.map(cat => cat.id));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories and items.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleSelectItem = (categoryId: string, item: CategoryItem) => {
    const existingItemIndex = selectedItems.findIndex(
      (selected) => selected.id === item.id
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity if already selected
      const newSelectedItems = [...selectedItems];
      newSelectedItems[existingItemIndex].quantity += 1;
      setSelectedItems(newSelectedItems);
    } else {
      // Add new item
      setSelectedItems([
        ...selectedItems,
        {
          id: item.id,
          categoryId,
          name: item.name,
          description: item.description || "",
          price: item.price,
          quantity: 1,
          unit: item.unit || "Unit"
        }
      ]);
    }
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove if quantity becomes 0
      handleRemoveItem(index);
      return;
    }
    
    const newSelectedItems = [...selectedItems];
    newSelectedItems[index].quantity = newQuantity;
    setSelectedItems(newSelectedItems);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleDone = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item to add.",
        variant: "destructive",
      });
      return;
    }
    
    onSelectItems(selectedItems);
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (selectedItems.length > 0) {
      // Confirm before discarding selections
      if (confirm("You have selected items. Are you sure you want to discard them?")) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  };

  // Filter categories and items based on search query
  const filteredCategories = categories.map(category => {
    const filteredItems = (categoryItems[category.id] || []).filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return {
      ...category,
      hasMatchingItems: filteredItems.length > 0
    };
  }).filter(category => 
    searchQuery === "" || 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.hasMatchingItems
  );

  const handleAccordionChange = (value: string) => {
    if (expandedCategories.includes(value)) {
      setExpandedCategories(expandedCategories.filter(id => id !== value));
    } else {
      setExpandedCategories([...expandedCategories, value]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-md p-0 flex flex-col h-full">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>Select Items from Categories</SheetTitle>
          <SheetDescription>
            Browse through categories and select items to add to your document.
          </SheetDescription>
          
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories and items..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-6 pt-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading categories and items...</p>
            ) : filteredCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No categories or items match your search.</p>
            ) : (
              <Accordion 
                type="multiple" 
                value={expandedCategories} 
                className="w-full"
              >
                {filteredCategories.map((category) => (
                  <AccordionItem key={category.id} value={category.id} className="border-b">
                    <AccordionTrigger 
                      onClick={() => handleAccordionChange(category.id)}
                      className="hover:bg-muted/50 px-4 rounded-md -mx-4"
                    >
                      {category.name}
                    </AccordionTrigger>
                    <AccordionContent className="overflow-auto max-h-64">
                      <ScrollArea className="h-full max-h-60 pr-4">
                        <div className="space-y-2 mt-2">
                          {(categoryItems[category.id] || [])
                            .filter(item => 
                              searchQuery === "" || 
                              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((item) => (
                              <div key={item.id} className="border rounded-md p-3 hover:bg-muted/50">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-sm">{item.name}</h4>
                                    <p className="text-muted-foreground text-xs mt-1">
                                      {item.description || "No description provided"}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">RM {item.price.toFixed(2)}</p>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 px-2 mt-1"
                                      onClick={() => handleSelectItem(category.id, item)}
                                    >
                                      <Plus className="h-4 w-4" />
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          {(categoryItems[category.id] || []).filter(item => 
                            searchQuery === "" || 
                            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.description || "").toLowerCase().includes(searchQuery.toLowerCase())
                          ).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              No items match your search in this category.
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </ScrollArea>
          
          {/* Selected Items Section */}
          <div className="border-t">
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Selected Items ({selectedItems.length})</h4>
                {selectedItems.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedItems([])}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              
              <ScrollArea className="h-28">
                {selectedItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No items selected yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex justify-between items-center border-b pb-2">
                        <div className="flex-1 mr-2">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">RM {item.price.toFixed(2)} per {item.unit}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="w-8 text-center">
                            <p className="text-sm">{item.quantity}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-500 hover:text-red-600" 
                            onClick={() => handleRemoveItem(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <div className="mt-2 flex justify-between items-center text-sm pt-2">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold">RM {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <SheetFooter className="px-4 pb-4 pt-0 sm:justify-between">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleDone} disabled={selectedItems.length === 0}>
                <FolderCheck className="mr-2 h-4 w-4" />
                Add Selected Items
              </Button>
            </SheetFooter>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
