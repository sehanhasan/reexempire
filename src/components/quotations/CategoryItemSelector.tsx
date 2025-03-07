
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/common/Spinner";
import { categoryService } from "@/services";
import { Category, Subcategory, PricingOption } from "@/types/database";

export interface SelectedItem {
  id: string;
  description: string;
  category?: string;
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
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [pricingOptions, setPricingOptions] = useState<PricingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: SelectedItem }>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      loadData();
    } else {
      // Clear selections when dialog closes
      setSelectedItems({});
      setSearch("");
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, subcategoriesData, pricingOptionsData] = await Promise.all([
        categoryService.getAll(),
        categoryService.getAllSubcategories(),
        categoryService.getAllPricingOptions()
      ]);
      
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      setPricingOptions(pricingOptionsData);
      
      if (categoriesData.length > 0) {
        setActiveCategory(categoriesData[0].id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading categories:", error);
      setLoading(false);
    }
  };

  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId);
  };

  const getPricingOptionsForSubcategory = (subcategoryId: string) => {
    return pricingOptions.filter(opt => opt.subcategory_id === subcategoryId);
  };

  const toggleItemSelection = (item: PricingOption, category: Category) => {
    if (selectedItems[item.id]) {
      // Remove item
      const { [item.id]: removedItem, ...rest } = selectedItems;
      setSelectedItems(rest);
    } else {
      // Add item
      setSelectedItems({
        ...selectedItems,
        [item.id]: {
          id: item.id,
          description: item.name,
          category: category.name,
          price: item.price,
          quantity: 1,
          unit: item.unit
        }
      });
    }
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (selectedItems[itemId]) {
      setSelectedItems({
        ...selectedItems,
        [itemId]: {
          ...selectedItems[itemId],
          quantity
        }
      });
    }
  };

  const filteredCategories = search 
    ? categories.filter(cat => 
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        getSubcategoriesForCategory(cat.id).some(sub => 
          sub.name.toLowerCase().includes(search.toLowerCase()) ||
          getPricingOptionsForSubcategory(sub.id).some(opt => 
            opt.name.toLowerCase().includes(search.toLowerCase())
          )
        )
      )
    : categories;

  const handleAddItems = () => {
    onSelectItems(Object.values(selectedItems));
    onOpenChange(false);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex justify-center items-center h-40">
            <Spinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Select Items from Categories</DialogTitle>
        </DialogHeader>
        
        <div className="mb-3">
          <Input 
            placeholder="Search items, categories or subcategories..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No categories found
            </div>
          ) : (
            <Tabs 
              defaultValue={activeCategory || ""} 
              onValueChange={(value) => setActiveCategory(value)}
              className="h-full flex flex-col"
            >
              <TabsList className="w-full justify-start overflow-x-auto pb-1 mb-2">
                {filteredCategories.map((category) => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="px-3 py-1.5"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 overflow-y-auto pr-1">
                {filteredCategories.map((category) => (
                  <TabsContent 
                    key={category.id} 
                    value={category.id}
                    className="mt-0 border-0 data-[state=active]:block h-full"
                  >
                    <div className="space-y-4">
                      {getSubcategoriesForCategory(category.id).length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No subcategories in this category
                        </div>
                      ) : (
                        getSubcategoriesForCategory(category.id).map((subcategory) => {
                          const options = getPricingOptionsForSubcategory(subcategory.id);
                          if (options.length === 0) return null;
                            
                          return (
                            <div key={subcategory.id} className="border rounded-md p-3">
                              <h3 className="font-medium mb-2">{subcategory.name}</h3>
                              <div className="space-y-2">
                                {options.map((option) => {
                                  const isSelected = !!selectedItems[option.id];
                                  return (
                                    <div key={option.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                                      <div className="flex items-center gap-3">
                                        <Checkbox 
                                          checked={isSelected} 
                                          onCheckedChange={() => toggleItemSelection(option, category)}
                                          id={`option-${option.id}`}
                                        />
                                        <div>
                                          <label 
                                            htmlFor={`option-${option.id}`}
                                            className="font-medium cursor-pointer"
                                          >
                                            {option.name}
                                          </label>
                                          <div className="text-sm text-gray-500">
                                            {option.unit} · RM {option.price.toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {isSelected && (
                                        <div className="flex items-center gap-1 w-24">
                                          <Button 
                                            type="button"
                                            variant="outline" 
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => updateItemQuantity(
                                              option.id, 
                                              Math.max(1, selectedItems[option.id].quantity - 1)
                                            )}
                                          >
                                            -
                                          </Button>
                                          <Input 
                                            type="number"
                                            min="1"
                                            className="h-7 text-center px-1"
                                            value={selectedItems[option.id].quantity}
                                            onChange={(e) => updateItemQuantity(
                                              option.id, 
                                              parseInt(e.target.value) || 1
                                            )}
                                          />
                                          <Button 
                                            type="button"
                                            variant="outline" 
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => updateItemQuantity(
                                              option.id, 
                                              selectedItems[option.id].quantity + 1
                                            )}
                                          >
                                            +
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          )}
        </div>

        <div className="pt-2 border-t mt-2">
          <div className="flex justify-between mb-3">
            <div className="text-sm">
              {Object.keys(selectedItems).length} items selected
            </div>
            <div className="text-sm font-medium">
              Total: RM {Object.values(selectedItems).reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleAddItems}
              disabled={Object.keys(selectedItems).length === 0}
            >
              Add Selected Items
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
