
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { categoryService } from "@/services";

interface Subcategory {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface PricingOption {
  id: string;
  name: string;
  price: number;
  unit: string;
}

interface Category {
  id: string;
  name: string;
}

interface SubcategoriesDialogProps {
  category: Category;
  isOpen: boolean;
  onClose: () => void;
}

const formatMoney = (amount: number) => {
  return `RM ${amount.toFixed(2)}`;
};

export function SubcategoriesDialog({ category, isOpen, onClose }: SubcategoriesDialogProps) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [pricingOptions, setPricingOptions] = useState<{ [key: string]: PricingOption[] }>({});

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const fetchedSubcategories = await categoryService.getSubcategoriesByCategoryId(category.id);
        setSubcategories(fetchedSubcategories);

        // Fetch pricing options for each subcategory
        const options: { [key: string]: PricingOption[] } = {};
        for (const subcategory of fetchedSubcategories) {
          const fetchedOptions = await categoryService.getAllPricingOptions();
          // Filter options for this subcategory
          options[subcategory.id] = fetchedOptions.filter(option => option.subcategory_id === subcategory.id);
        }
        setPricingOptions(options);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      }
    };

    if (isOpen) {
      fetchSubcategories();
    }
  }, [category.id, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{category.name} - Subcategories</DialogTitle>
          <DialogDescription>
            Manage subcategories and pricing options for {category.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {subcategories.map((subcategory) => (
            <div key={subcategory.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{subcategory.name}</h3>
                <Badge variant="secondary">
                  {formatMoney(subcategory.price)}
                </Badge>
              </div>
              
              {subcategory.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {subcategory.description}
                </p>
              )}
              
              {pricingOptions[subcategory.id] && pricingOptions[subcategory.id].length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Pricing Options:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {pricingOptions[subcategory.id].map((option) => (
                      <div key={option.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{option.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{formatMoney(option.price)}</span>
                          <span className="text-xs text-muted-foreground">per {option.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
