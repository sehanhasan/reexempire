
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Category, Subcategory } from '@/types/database';
import { categoryService } from '@/services/categoryService';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, MoreHorizontal, Edit, Trash2, Tag } from 'lucide-react';

interface SubcategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
}

export function SubcategoriesDialog({ open, onOpenChange, category }: SubcategoriesDialogProps) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<Subcategory | null>(null);

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

  const handleDeleteSubcategory = (subcategory: Subcategory) => {
    setSubcategoryToDelete(subcategory);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSubcategory = async () => {
    if (!subcategoryToDelete) return;
    
    try {
      await categoryService.deleteSubcategory(subcategoryToDelete.id);
      setSubcategories(prev => prev.filter(sub => sub.id !== subcategoryToDelete.id));
      setShowDeleteConfirm(false);
      setSubcategoryToDelete(null);
      
      toast({
        title: "Subcategory Deleted",
        description: `${subcategoryToDelete.description} has been deleted.`,
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast({
        title: "Error",
        description: "There was an error deleting the subcategory.",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {category?.name}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {subcategories.length} subcategories
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading subcategories...</p>
                </div>
              </div>
            ) : subcategories.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Tag className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subcategories yet</h3>
                <p className="text-gray-500">This category doesn't have any subcategories.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subcategories.map((subcategory) => (
                  <Card key={subcategory.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {subcategory.name || subcategory.description}
                          </h4>
                          {subcategory.description && subcategory.name !== subcategory.description && (
                            <p className="text-sm text-gray-600">{subcategory.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {subcategory.price !== null && subcategory.price !== undefined && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200">
                              {formatPrice(subcategory.price)}
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="cursor-pointer text-red-600"
                                onClick={() => handleDeleteSubcategory(subcategory)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{subcategoryToDelete?.description}"? 
              This action cannot be undone and will also delete all associated pricing options.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSubcategory}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
