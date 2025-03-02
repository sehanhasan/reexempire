import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Subcategory, PricingOption } from "@/components/categories/SubcategoryModel";

// Define the type for the selected items
export interface SelectedItem {
  id: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
}
interface Category {
  id: string;
  name: string;
  description: string;
  subcategories: Subcategory[];
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});

  // Fetch categories - in a real app, this would come from an API
  useEffect(() => {
    // Mock data - replace with actual API call
    const mockCategories: Category[] = [{
      id: "CAT-001",
      name: "Bathroom Renovation",
      description: "Complete bathroom remodeling services",
      subcategories: [{
        id: "SUB-001",
        name: "Toilet Installation",
        description: "Removal and installation of toilets",
        pricingOptions: [{
          id: "PO-001",
          name: "Standard Toilet",
          price: 250,
          unit: "Unit"
        }, {
          id: "PO-002",
          name: "Premium Toilet",
          price: 450,
          unit: "Unit"
        }]
      }, {
        id: "SUB-002",
        name: "Sink Installation",
        description: "Removal and installation of sinks",
        pricingOptions: [{
          id: "PO-003",
          name: "Standard Sink",
          price: 200,
          unit: "Unit"
        }, {
          id: "PO-004",
          name: "Premium Sink",
          price: 350,
          unit: "Unit"
        }]
      }]
    }, {
      id: "CAT-002",
      name: "Kitchen Remodeling",
      description: "Kitchen upgrade and renovation",
      subcategories: [{
        id: "SUB-003",
        name: "Cabinets Installation",
        description: "Installation of kitchen cabinets",
        pricingOptions: [{
          id: "PO-005",
          name: "Standard Cabinets",
          price: 450,
          unit: "Unit"
        }, {
          id: "PO-006",
          name: "Custom Cabinets",
          price: 800,
          unit: "Unit"
        }]
      }]
    }, {
      id: "CAT-003",
      name: "Flooring",
      description: "All types of flooring installation and repair",
      subcategories: [{
        id: "SUB-004",
        name: "Tile Installation",
        description: "Installation of floor tiles",
        pricingOptions: [{
          id: "PO-007",
          name: "Ceramic Tiles",
          price: 25,
          unit: "Sq.m"
        }, {
          id: "PO-008",
          name: "Porcelain Tiles",
          price: 35,
          unit: "Sq.m"
        }]
      }]
    }];
    setCategories(mockCategories);
    if (mockCategories.length > 0 && !activeTab) {
      setActiveTab(mockCategories[0].id);
    }
  }, []);

  // Filter categories based on search
  const filteredCategories = searchQuery ? categories.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.subcategories.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || sub.pricingOptions.some(option => option.name.toLowerCase().includes(searchQuery.toLowerCase())))) : categories;
  const handleToggleItem = (category: Category, subcategory: Subcategory, pricingOption: PricingOption) => {
    const itemKey = `${category.id}-${subcategory.id}-${pricingOption.id}`;
    setSelectedItems(prev => {
      const newItems = {
        ...prev
      };
      if (newItems[itemKey]) {
        // If already selected, remove it
        delete newItems[itemKey];
      } else {
        // Otherwise add it
        newItems[itemKey] = {
          id: pricingOption.id,
          categoryId: category.id,
          categoryName: category.name,
          subcategoryId: subcategory.id,
          subcategoryName: subcategory.name,
          description: `${subcategory.name} - ${pricingOption.name}`,
          price: pricingOption.price,
          quantity: 1,
          unit: pricingOption.unit
        };
      }
      return newItems;
    });
  };
  const handleConfirm = () => {
    onSelectItems(Object.values(selectedItems));
    onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Items from Categories</DialogTitle>
          <DialogDescription>
            Choose services from your categories to add to your quotation.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search categories, subcategories or items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        {filteredCategories.length > 0 ? <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="flex overflow-x-auto">
              {filteredCategories.map(category => <TabsTrigger key={category.id} value={category.id} className="flex-shrink-0">
                  {category.name}
                </TabsTrigger>)}
            </TabsList>
            
            {filteredCategories.map(category => <TabsContent key={category.id} value={category.id} className="flex-1 overflow-hidden mt-0 border rounded-md p-0">
                <ScrollArea className="h-[350px] p-4">
                  {category.subcategories.length === 0 ? <p className="text-center text-muted-foreground py-4">
                      No subcategories found in this category.
                    </p> : <div className="space-y-6">
                      {category.subcategories.map(subcategory => <div key={subcategory.id} className="space-y-2">
                          <h3 className="font-semibold">{subcategory.name}</h3>
                          <p className="text-sm text-muted-foreground">{subcategory.description}</p>
                          
                          <div className="ml-4 mt-2 space-y-2">
                            {subcategory.pricingOptions.map(option => {
                    const itemKey = `${category.id}-${subcategory.id}-${option.id}`;
                    const isSelected = !!selectedItems[itemKey];
                    return <div key={option.id} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox id={itemKey} checked={isSelected} onCheckedChange={() => handleToggleItem(category, subcategory, option)} />
                                    <label htmlFor={itemKey} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                      {option.name}
                                    </label>
                                  </div>
                                  <div className="text-sm">
                                    RM {option.price.toFixed(2)} / {option.unit}
                                  </div>
                                </div>;
                  })}
                          </div>
                        </div>)}
                    </div>}
                </ScrollArea>
              </TabsContent>)}
          </Tabs> : <div className="text-center py-8 text-muted-foreground">
            No categories found matching your search.
          </div>}

        

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => {
          setSelectedItems({});
          onOpenChange(false);
        }}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={Object.keys(selectedItems).length === 0}>
            Add {Object.keys(selectedItems).length} Item{Object.keys(selectedItems).length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}