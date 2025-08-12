
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { categoryService } from "@/services";
import { Category, Subcategory } from "@/types/database";

export default function AddCategory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("id");
  const isEditing = !!categoryId;

  const [category, setCategory] = useState({
    name: "",
    description: ""
  });
  const [subcategories, setSubcategories] = useState<(Subcategory & { isDeleted?: boolean })[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteSubcategoryId, setDeleteSubcategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && categoryId) {
      fetchCategory();
    }
  }, [isEditing, categoryId]);

  const fetchCategory = async () => {
    if (!categoryId) return;
    
    try {
      setLoading(true);
      const categoryData = await categoryService.getById(categoryId);
      setCategory({
        name: categoryData.name,
        description: categoryData.description || ""
      });

      // Fetch subcategories
      const subcategoriesData = await categoryService.getSubcategoriesByCategoryId(categoryId);
      setSubcategories(subcategoriesData.map(sub => ({ ...sub, isDeleted: false })));
    } catch (error) {
      console.error("Error fetching category:", error);
      toast({
        title: "Error",
        description: "Failed to load category",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addSubcategory = () => {
    const newSubcategory: Subcategory & { isDeleted?: boolean } = {
      tempId: Date.now(),
      category_id: categoryId || "",
      name: "",
      description: "",
      price: 0,
      isDeleted: false
    };
    setSubcategories([...subcategories, newSubcategory]);
  };

  const updateSubcategory = (index: number, field: keyof Subcategory, value: string | number) => {
    const updated = [...subcategories];
    if (field === 'name' || field === 'description') {
      (updated[index] as any)[field] = value as string;
    } else if (field === 'price') {
      updated[index].price = value as number;
    }
    setSubcategories(updated);
  };

  const removeSubcategory = (index: number) => {
    const subcategory = subcategories[index];
    if (subcategory.id) {
      // Mark existing subcategory as deleted
      const updated = [...subcategories];
      updated[index].isDeleted = true;
      setSubcategories(updated);
    } else {
      // Remove new subcategory completely
      setSubcategories(subcategories.filter((_, i) => i !== index));
    }
  };

  const confirmDeleteSubcategory = async () => {
    if (!deleteSubcategoryId) return;

    try {
      await categoryService.deleteSubcategory(deleteSubcategoryId);
      setSubcategories(subcategories.filter(sub => sub.id !== deleteSubcategoryId));
      toast({
        title: "Subcategory Deleted",
        description: "The subcategory has been deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast({
        title: "Error",
        description: "Failed to delete subcategory",
        variant: "destructive"
      });
    } finally {
      setDeleteSubcategoryId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing && categoryId) {
        // Update category
        await categoryService.update(categoryId, {
          name: category.name.trim(),
          description: category.description.trim() || null
        });

        // Handle subcategories
        const activeSubcategories = subcategories.filter(sub => !sub.isDeleted);
        const deletedSubcategories = subcategories.filter(sub => sub.isDeleted && sub.id);

        // Delete marked subcategories
        for (const deletedSub of deletedSubcategories) {
          if (deletedSub.id) {
            await categoryService.deleteSubcategory(deletedSub.id);
          }
        }

        // Update or create remaining subcategories
        for (const subcategory of activeSubcategories) {
          if (subcategory.name.trim()) {
            const subcategoryData = {
              category_id: categoryId,
              name: subcategory.name.trim(),
              description: subcategory.description?.trim() || null,
              price: subcategory.price || 0
            };

            if (subcategory.id) {
              await categoryService.updateSubcategory(subcategory.id, subcategoryData);
            } else {
              await categoryService.createSubcategory(subcategoryData);
            }
          }
        }

        toast({
          title: "Category Updated",
          description: "The category has been updated successfully."
        });
      } else {
        // Create new category
        const newCategory = await categoryService.create({
          name: category.name.trim(),
          description: category.description.trim() || null
        });

        // Create subcategories
        for (const subcategory of subcategories) {
          if (subcategory.name.trim()) {
            await categoryService.createSubcategory({
              category_id: newCategory.id,
              name: subcategory.name.trim(),
              description: subcategory.description?.trim() || null,
              price: subcategory.price || 0
            });
          }
        }

        toast({
          title: "Category Created",
          description: "The category has been created successfully."
        });
      }

      navigate("/categories");
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/categories")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Categories
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Category" : "Add Category"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={category.name}
                onChange={(e) => setCategory({ ...category, name: e.target.value })}
                placeholder="Enter category name"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={category.description}
                onChange={(e) => setCategory({ ...category, description: e.target.value })}
                placeholder="Enter category description"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subcategories</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addSubcategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subcategory
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subcategories.filter(sub => !sub.isDeleted).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No subcategories added. Click "Add Subcategory" to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {subcategories.map((subcategory, index) => {
                  if (subcategory.isDeleted) return null;
                  
                  return (
                    <div key={subcategory.id || subcategory.tempId} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          Subcategory {index + 1}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubcategory(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={subcategory.name}
                            onChange={(e) => updateSubcategory(index, 'name', e.target.value)}
                            placeholder="Subcategory name"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={subcategory.description || ""}
                            onChange={(e) => updateSubcategory(index, 'description', e.target.value)}
                            placeholder="Description"
                          />
                        </div>
                        <div>
                          <Label>Price (RM)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={subcategory.price || ""}
                            onChange={(e) => updateSubcategory(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/categories")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>

      <AlertDialog open={!!deleteSubcategoryId} onOpenChange={() => setDeleteSubcategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subcategory? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSubcategory} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
