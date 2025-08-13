import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Category, Subcategory, categoryService } from "@/services/categoryService";
import { useToast } from "@/hooks/use-toast";

interface SubcategoriesDialogProps {
  category: Category;
  isOpen: boolean;
  onClose: () => void;
}

interface SubcategoryModelProps {
  subcategory: Subcategory | null;
  categoryId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (subcategory: Subcategory) => void;
}

export function SubcategoriesDialog({ category, isOpen, onClose }: SubcategoriesDialogProps) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [deletingSubcategory, setDeletingSubcategory] = useState<Subcategory | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchSubcategories();
    }
  }, [isOpen, category]);

  const fetchSubcategories = async () => {
    setIsLoading(true);
    try {
      const data = await categoryService.getSubcategories(category.id);
      setSubcategories(data);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch subcategories",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSubcategory = async (subcategory: Subcategory) => {
    setIsLoading(true);
    try {
      if (subcategory.id) {
        // Update existing subcategory
        await categoryService.updateSubcategory(subcategory.id, subcategory);
        setSubcategories(prev =>
          prev.map(sub => (sub.id === subcategory.id ? subcategory : sub))
        );
        toast({
          title: "Success",
          description: "Subcategory updated successfully",
        });
      } else {
        // Create new subcategory
        const newSubcategory = await categoryService.createSubcategory({
          ...subcategory,
          category_id: category.id,
        });
        setSubcategories(prev => [...prev, newSubcategory]);
        toast({
          title: "Success",
          description: "Subcategory created successfully",
        });
      }
      setEditingSubcategory(null);
      fetchSubcategories(); // Refresh subcategories
    } catch (error) {
      console.error("Error saving subcategory:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save subcategory",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubcategory = async () => {
    if (!deletingSubcategory) return;

    setIsLoading(true);
    try {
      await categoryService.deleteSubcategory(deletingSubcategory.id);
      
      // Remove from local state
      setSubcategories(prev => prev.filter(sub => sub.id !== deletingSubcategory.id));
      
      toast({
        title: "Success",
        description: "Subcategory deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete subcategory",
      });
    } finally {
      setIsLoading(false);
      setDeletingSubcategory(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subcategories for {category.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              onClick={() => setEditingSubcategory({} as Subcategory)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Subcategory
            </Button>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : subcategories.length === 0 ? (
              <div className="text-center text-muted-foreground p-8">
                No subcategories found for this category.
              </div>
            ) : (
              <div className="grid gap-4">
                {subcategories.map((subcategory) => (
                  <Card key={subcategory.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{subcategory.name}</h3>
                          {subcategory.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {subcategory.description}
                            </p>
                          )}
                          <p className="text-sm font-medium text-primary mt-2">
                            ${subcategory.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSubcategory(subcategory)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingSubcategory(subcategory)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSubcategory} onOpenChange={() => setDeletingSubcategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingSubcategory?.name}" and all its pricing options. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubcategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Subcategory Modal */}
      {editingSubcategory && (
        <SubcategoryModel
          subcategory={editingSubcategory.id ? editingSubcategory : null}
          categoryId={category.id}
          isOpen={!!editingSubcategory}
          onClose={() => setEditingSubcategory(null)}
          onSave={handleSaveSubcategory}
        />
      )}
    </>
  );
}

function SubcategoryModel({ subcategory, categoryId, isOpen, onClose, onSave }: SubcategoryModelProps) {
  const [name, setName] = useState(subcategory?.name || "");
  const [description, setDescription] = useState(subcategory?.description || "");
  const [price, setPrice] = useState(subcategory?.price?.toString() || "");

  useEffect(() => {
    if (subcategory) {
      setName(subcategory.name || "");
      setDescription(subcategory.description || "");
      setPrice(subcategory.price?.toString() || "");
    } else {
      setName("");
      setDescription("");
      setPrice("");
    }
  }, [subcategory]);

  const handleSubmit = () => {
    if (!name || !price) {
      alert("Name and price are required");
      return;
    }

    const newSubcategory = {
      id: subcategory?.id || "",
      category_id: categoryId,
      name,
      description,
      price: parseFloat(price),
      created_at: subcategory?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(newSubcategory);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{subcategory ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
          <DialogDescription>
            {subcategory ? "Update the subcategory details." : "Enter the details for the new subcategory."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price
            </Label>
            <Input
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
              type="number"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {subcategory ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
