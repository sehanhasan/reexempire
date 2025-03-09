import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";
import { categoryService } from "@/services";
import { Category, Subcategory, PricingOption } from "@/types/database";
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const categoriesData = await categoryService.getAll();
        setCategories(categoriesData);
        const subcategoriesData = await categoryService.getAllSubcategories();
        setSubcategories(subcategoriesData);
        const pricingOptionsData = await categoryService.getAllPricingOptions();
        setPricingOptions(pricingOptionsData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (open) {
      fetchData();
    }
  }, [open]);
  useEffect(() => {
    if (open) {
      setSelectedItems([]);
      setSearchTerm("");
    }
  }, [open]);

  // Function to toggle subcategory selection when there's no pricing options
  const toggleSubcategorySelection = (subcategory: Subcategory, categoryName: string) => {
    setSelectedItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === subcategory.id);
      if (existingItem) {
        return prevItems.filter(item => item.id !== subcategory.id);
      } else {
        return [...prevItems, {
          id: subcategory.id,
          description: subcategory.name,
          category: categoryName,
          quantity: 1,
          unit: "Unit",
          price: subcategory.price || 0
        }];
      }
    });
  };
  const togglePricingOptionSelection = (pricingOption: PricingOption, subcategoryName: string) => {
    setSelectedItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === pricingOption.id);
      if (existingItem) {
        return prevItems.filter(item => item.id !== pricingOption.id);
      } else {
        return [...prevItems, {
          id: pricingOption.id,
          description: pricingOption.name,
          category: subcategoryName,
          quantity: 1,
          unit: pricingOption.unit,
          price: pricingOption.price
        }];
      }
    });
  };
  const updateItemQuantity = (id: string, quantity: number) => {
    setSelectedItems(prevItems => prevItems.map(item => item.id === id ? {
      ...item,
      quantity
    } : item));
  };
  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(subcategory => subcategory.category_id === categoryId);
  };
  const getPricingOptionsForSubcategory = (subcategoryId: string) => {
    return pricingOptions.filter(option => option.subcategory_id === subcategoryId);
  };
  const isItemSelected = (id: string) => {
    return selectedItems.some(item => item.id === id);
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };
  const handleSubmit = () => {
    onSelectItems(selectedItems);
    onOpenChange(false);
  };
  const filteredCategories = searchTerm ? categories.filter(category => {
    if (category.name.toLowerCase().includes(searchTerm)) return true;
    const relatedSubcategories = getSubcategoriesForCategory(category.id);
    if (relatedSubcategories.some(sub => sub.name.toLowerCase().includes(searchTerm))) return true;
    return relatedSubcategories.some(sub => {
      const options = getPricingOptionsForSubcategory(sub.id);
      return options.some(option => option.name.toLowerCase().includes(searchTerm));
    });
  }) : categories;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Select Items from Categories</DialogTitle>
          <DialogDescription>
            Choose services from your categories to add to your quotation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search categories, subcategories or items..." className="pl-9 h-10" value={searchTerm} onChange={handleSearchChange} />
        </div>
        
        <div className="overflow-y-auto max-h-[50vh] mt-4 pr-1">
          {isLoading ? <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-2 border-t-blue-500 rounded-full"></div>
            </div> : filteredCategories.length === 0 ? <div className="text-center py-8 text-gray-500">
              No categories found matching your search.
            </div> : <Accordion type="multiple" value={expandedCategories} onValueChange={setExpandedCategories} className="w-full">
              {filteredCategories.map(category => {
            const categorySubcategories = getSubcategoriesForCategory(category.id);
            return <AccordionItem value={category.id} key={category.id} className="border rounded-md mb-2">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      {category.name}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-2 overflow-y-auto max-h-[300px]">
                      {categorySubcategories.length === 0 ? <div className="text-center py-2 text-sm text-gray-500">
                          No items in this category
                        </div> : categorySubcategories.map(subcategory => {
                  const subcategoryOptions = getPricingOptionsForSubcategory(subcategory.id);

                  // Display the subcategory even if it has no pricing options
                  return <div key={subcategory.id} className="mb-4">
                              
                              <div className="space-y-2">
                                {subcategoryOptions.length === 0 ?
                      // If no pricing options, display the subcategory itself as selectable
                      <div className={`flex items-center justify-between p-2 rounded-md transition-colors ${isItemSelected(subcategory.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                    <div className="flex items-center">
                                      <Checkbox id={subcategory.id} checked={isItemSelected(subcategory.id)} onCheckedChange={() => toggleSubcategorySelection(subcategory, category.name)} className="mr-2" />
                                      <label htmlFor={subcategory.id} className="text-sm cursor-pointer flex-1">
                                        {subcategory.name}
                                      </label>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                      {isItemSelected(subcategory.id) && <div className="flex items-center space-x-2">
                                          <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => {
                              const selectedItem = selectedItems.find(item => item.id === subcategory.id);
                              updateItemQuantity(subcategory.id, Math.max(1, (selectedItem?.quantity || 1) - 1));
                            }}>
                                            <span>-</span>
                                          </Button>
                                          <span className="text-sm font-medium w-6 text-center">
                                            {selectedItems.find(item => item.id === subcategory.id)?.quantity || 1}
                                          </span>
                                          <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => {
                              const selectedItem = selectedItems.find(item => item.id === subcategory.id);
                              updateItemQuantity(subcategory.id, (selectedItem?.quantity || 1) + 1);
                            }}>
                                            <span>+</span>
                                          </Button>
                                        </div>}
                                      <span className="text-sm font-medium whitespace-nowrap">
                                        RM {(subcategory.price || 0).toFixed(2)}
                                      </span>
                                    </div>
                                  </div> :
                      // If there are pricing options, display them as usual
                      subcategoryOptions.map(option => {
                        const isSelected = isItemSelected(option.id);
                        const selectedItem = selectedItems.find(item => item.id === option.id);
                        return <div key={option.id} className={`flex items-center justify-between p-2 rounded-md transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                        <div className="flex items-center">
                                          <Checkbox id={option.id} checked={isSelected} onCheckedChange={() => togglePricingOptionSelection(option, subcategory.name)} className="mr-2" />
                                          <label htmlFor={option.id} className="text-sm cursor-pointer flex-1">
                                            {option.name}
                                          </label>
                                        </div>
                                        
                                        <div className="flex items-center space-x-3">
                                          {isSelected && <div className="flex items-center space-x-2">
                                              <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateItemQuantity(option.id, Math.max(1, (selectedItem?.quantity || 1) - 1))}>
                                                <span>-</span>
                                              </Button>
                                              <span className="text-sm font-medium w-6 text-center">
                                                {selectedItem?.quantity || 1}
                                              </span>
                                              <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateItemQuantity(option.id, (selectedItem?.quantity || 1) + 1)}>
                                                <span>+</span>
                                              </Button>
                                            </div>}
                                          <span className="text-sm font-medium whitespace-nowrap">
                                            RM {option.price.toFixed(2)} / {option.unit}
                                          </span>
                                        </div>
                                      </div>;
                      })}
                              </div>
                            </div>;
                })}
                    </AccordionContent>
                  </AccordionItem>;
          })}
            </Accordion>}
        </div>
        
        <div className="flex justify-between items-center pt-4 mt-2 border-t">
          <div className="text-sm">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex space-x-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={selectedItems.length === 0}>
              Add {selectedItems.length} Item{selectedItems.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}