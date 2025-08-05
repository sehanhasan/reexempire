
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Category, Subcategory } from '@/types/database';
import { categoryService } from '@/services/categoryService';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface SubcategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
}

export function SubcategoriesDialog({ open, onOpenChange, category }: SubcategoriesDialogProps) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (open && category) {
        setIsLoading(true);
        try {
          const subcats = await categoryService.getSubcategoriesByCategoryId(category.id);
          
          // Ensure we don't have duplicates by using a Map with the ID as key
          const uniqueSubcategories = new Map();
          subcats.forEach(subcat => {
            if (!uniqueSubcategories.has(subcat.id)) {
              uniqueSubcategories.set(subcat.id, subcat);
            }
          });
          
          // Convert Map back to array
          setSubcategories(Array.from(uniqueSubcategories.values()));
        } catch (error) {
          console.error("Error fetching subcategories:", error);
          toast({
            title: "Error",
            description: `Could not display subcategories for ${category.name}`,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSubcategories();
  }, [open, category]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>{category?.name} - Subcategories</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : subcategories.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No subcategories found
            </div>
          ) : (
            <div className="space-y-3">
              {subcategories.map((subcategory) => (
                <Card key={subcategory.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm mt-1">{subcategory.description}</p>
                      </div>
                      {subcategory.price !== null && subcategory.price !== undefined && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          {formatPrice(subcategory.price)}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
